/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */

define( function( require, exports, module ) {
    'use strict';

	var Strings = require('modules/Strings'),


		TIMEOUT_EXECUTED_INDICATOR = 10000,

		// Mustache templates.
		$indicator,
		_timer = false,
		_curServer,

		setTimer = function() {
			if ( _timer !== false ) clearTimeout(_timer);
			setTimeout(function() {
				if ( _curServer !== false ) setText(_curServer.name);
				else disconnected();
			}, TIMEOUT_EXECUTED_INDICATOR);
		},

		setConnectionStatus = function(status) {
			$indicator
				.removeClass('connected disconnected error executing finished')
				.addClass(status);

			if ( status === 'disconnected' ) {
				$indicator.data('sid', false);
			}
			return this;
		},

		setText = function(text) {
			$('.label', $indicator).html(text);
			return this;
		},

		setStatus = function(status) {
			$indicator
				.removeClass('error executing finished')
				.addClass(status);

			return this;
		},

		setServer = function(server) {
			_curServer = server;
			$indicator.data("sid", server.__id);
			setConnectionStatus('connected');
			setText(server.name);
			return this;
		},

		error = function(svr, err, details) {
			setStatus('error');
			setText(err + ": " + (typeof details === 'string' ? details : (details.message || '')));
			setTimer();
			return this;
		},

		toggleExecute = function(enabled) {
			enabled = enabled === undefined ? !$indicator.hasClass("has-sql") : enabled;
			if ( enabled === true && ! $indicator.addClass('has-sql') ) $indicator.addClass('has-sql');
			else if ( enabled === false ) $indicator.removeClass('has-sql');
			return this;
		},

		disconnected = function() {
			setConnectionStatus('disconnected');
			setText(Strings.DISCONNECTED);
			$indicator.data("sid", false);
			_curServer = false;
			return this;
		},

		executing = function() {
			setStatus('executing');
			setText(Strings.EXECUTING);
		},

		executed = function(text) {
			setStatus('executed');
			setText(text);
			setTimer();
			return this;
		},

		isExecuting = function() {
			return $indicator.hasClass("executing");
		},

		getCurrentId = function() {
			return _curServer.__id;
		},

		init = function($ind) {
			$indicator = $ind;
		};

	module.exports = {
		init: init,
		setServer: setServer,
		setText: setText,
		setStatus: setStatus,
		getCurrentId: getCurrentId,
		isExecuting: isExecuting,
		executed: executed,
		executing: executing,
		disconnected: disconnected,
		toggleExecute: toggleExecute,
		error: error,
		setConnectionStatus: setConnectionStatus
	};

});
