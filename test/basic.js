"use strict";

const expect = require("chai").expect;
const assert = require("chai").assert;
const env = require("../config/env.json");
const Nightmare = require( "nightmare" );

let chai = require('chai')
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const validUrl = require('valid-url');

let BASE_URL = env.baseUrl;

describe("application", function () {
  it('has a valid base url', function() {
    var validUrl = require('valid-url');
    assert.isOk(
      validUrl.isUri(BASE_URL),
      'correct url is not set in config/env.json'
    );
  });
});


describe("/login ", function(){
  this.timeout("10s");
  let nightmare;

  it('loads with a normative HTTP response status', function(done){
    chai.request(BASE_URL)
    .get('/login')
    .end(function (err, res) {
      expect(err).to.be.null;
      expect(res).to.have.any.status(200, 301, 302, 303, 304, 307);
      done();
    })
    // .catch(done);
  });

  it("takes user to correct redirect", function(done){
    nightmare = new Nightmare();
    nightmare.goto(`${BASE_URL}/login`)
    .url()
    .then( url => {
      expect(url).to.contain(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize`);
      done();
    })
    .catch(done);
  });

  it("prints no errors to client console", function(done){
    let frontendMessages = [];
    nightmare = new Nightmare();
    nightmare
    .on('console', function (logType, args) {
      let output = `console.${logType}: ${args}`
      frontendMessages.push(output);
    })
    .on('page', function(type, message, stack){
      let output = `page ${type}: ${message}`
      frontendMessages.push(output);
    })
    .goto( `${BASE_URL}/login` )
    // .wait(250)
    .then( results => {
      expect(frontendMessages).to.be.ok;

      const evalOutputs = function(frontendMessages){
        // makes printable any messages obtained from the frontend console.
        let hasErrors;

        switch (true) {
        case frontendMessages.length === 0:
          console.info("Info: Nothing was printed to frontend console.");
          hasErrors = false;
          break;
        case frontendMessages.length >= 1:
          let output = "The below was printed to frontend console: " + 
            frontendMessages.reduce( (text, line) => {
              return `\n ${text} \n ${line}`;
            }) + "\n";
          console.info(output);
          if (output.toLowerCase().search("error") === -1) { hasErrors = false; }
          break;
        default:
          console.error(
              "Error: Console output from frontend is not in the expected format.");
          hasErrors = true;
        }
        return hasErrors;
      };

      let hasErrors = evalOutputs(frontendMessages);

      expect(hasErrors).to.be.false;
      done();
    })
    .catch(done);
  });
});
