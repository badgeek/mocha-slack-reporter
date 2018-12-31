(function() {
  const Base = require("mocha").reporters.base;
  const NodeSlack = require("node-slack");

  const Slack = (function() {
    function Slack(runner, reporter_options) {
      let passes = 0;
      let failures = 0;
      let options = reporter_options.reporterOptions;

      let messageOptions = {
        username: "",
        text: "",
        channel: options.channel,
        icon_emoji: ""
      };

      let test_failed = [];
      let test_passed = [];
      let test_suites = [];

      const slack = new NodeSlack(options.hook_url);

      function buildSuiteName() {
        return test_suites.join(" - ");
      }

      runner.on("suite", suite => {
        test_suites.push(suite.title);
      });

      runner.on("pass", test => {
        test_passed.push({
          suite: buildSuiteName(),
          title: test.title,
          duration: test.duration
        });
      });

      runner.on("fail", (test, err) => {
        test_failed.push({
          suite: buildSuiteName(),
          title: test.title,
          duration: test.duration,
          error: test.err
        });
      });

      runner.once("end", () => {
        const failed = !!test_failed.length;
        
        if (!failed && options.failuresOnly) {
            return;
        }
        
        messageOptions.attachments = [];

        const test_total = (test_failed.length+test_passed.length);
        const test_failed_total = (test_failed.length);
        const test_passed_total = (test_passed.length);
        
        if (failed) {
          messageOptions.icon_emoji = options.failEmoji || ":boom:";
          messageOptions.text = options.failEmoji + " FAILED: " + options.testTitle + "\n" + "[Failed: " + test_failed_total + "] [Success: " + test_passed_total + "] [Total Test: "+test_total+"]";

          test_failed.forEach(function(f) {
            messageOptions.attachments.push({
              color: "#FF0000",
              text: "Failed: " + f.suite + " > " + f.title,
              fallback: "Failed: " + f.suite + " > " + f.title + "\n" + f.error.message,
              fields: [
                {
                  title: "" + f.error.message,
                  short: false
                }
              ]
            });
            // console.log(f.error);
          });
        } else {
          messageOptions.icon_emoji = options.passEmoji || ":ok_hand:";
          messageOptions.text = options.passEmoji + " PASSED: " + options.testTitle;
          messageOptions.attachments.push({
            color: "#008000",
            text: "Hooorayy! Passed all " + (test_failed.length+test_passed.length) + " tests",
          });

        }
        
        if(process.env.CI) {
            messageOptions.text = messageOptions.text + " <" + process.env.CI_JOB_URL + "|(view job logs)> " + " <" + process.env.CI_PROJECT_URL + "/commit/" +  process.env.CI_COMMIT_SHA + "|(view commit)>\n";
            messageOptions.text = messageOptions.text + "Commit Message: " + process.env.CI_COMMIT_MESSAGE + "\n";
            messageOptions.text = messageOptions.text + "Commit Author: " + process.env.CI_PROJECT_NAMESPACE + "\n";
            messageOptions.text = messageOptions.text + "Commit Hash: " + process.env.CI_COMMIT_SHA + "\n";
        }

        slack.send(messageOptions);
      });
    }   

    return Slack;
  })();

  module.exports = Slack;
}.call(this));
