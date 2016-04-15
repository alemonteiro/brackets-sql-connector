/* jshint node: true */

(function () {
	'use strict';

	var DOMAIN_NAME = "installDependencies";

	var exec = require("child_process").exec;

	var _domainManager, child;

	function install() {
		var out = '';
		child = exec("npm install", {
			cwd: __dirname
		});
		child.stdout.on("data", function (data) {
			out += data;
		});
		child.stderr.on("data", function (data) {
			out += data;
		});
		child.on("exit", function (code) {
			_domainManager.emitEvent(DOMAIN_NAME, "installComplete", [code, out]);
		});
	}

	function init(domainManager) {
		_domainManager = domainManager;
		if (!domainManager.hasDomain(DOMAIN_NAME)) {
			domainManager.registerDomain(DOMAIN_NAME, {
				major: 0,
				minor: 1
			});
		}
		domainManager.registerCommand(
			DOMAIN_NAME,
			"install",
			install,
			false,
			"Calls npm install"
		);
		domainManager.registerEvent(
			DOMAIN_NAME,
			"installComplete", [{
				name: "code",
				type: "number",
				description: "Exit Code"
			}, {
				name: "out",
				type: "string",
				description: "Out data from process"
			}]
		);
	}

	exports.init = init;
}());
