/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */

define( function( require, exports, module ) {
    'use strict';
	
	var Strings = require('modules/Strings'),
		
		CommandManager = brackets.getModule('command/CommandManager'),
		Commands = brackets.getModule('command/Commands'),
		PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
		ProjectManager = brackets.getModule('project/ProjectManager'),
		WorkspaceManager = brackets.getModule('view/WorkspaceManager'),
		
		cmds = require('modules/SqlConnectorCommands'),
		
		// Mustache templates.
		queryPanelTemplate = require('text!html/result-pane.html'),
		queryResultSetTemplate = require('text!html/result-set.html'),
		
		ids = 0,
		prefix = "brackets-sql-connector-result-set-",
				
		add_achor = function(id) {
			var li = '<li class="active">' +
							'<a href="#" class="tab-anchor" data-target="#'+prefix + id +'">' + Strings.RESULT_SET + ' '  + id +'</a>' +
							'<a href="#" class="close close-result-set">&times;</a>' +
					'</li>';


			$("#brackets-sql-connector-log-pane-anchor").removeClass("active").siblings().removeClass('active');
			$("#brackets-sql-connector-log-pane-anchor").after($(li).addClass('active'));
		},

		add_log = function(title, extra, query) {
			var dt = new Date(),
				str = typeof extra === 'string' ? extra :
						(typeof extra=== 'object' ? JSON.stringify(extra) : ''),
				log = '<li>'+
						'<span class="data">' + dt.toLocaleTimeString() + '</span>' +
						'<label>' + title + '</label>' +
						'<span class="extra">' + str + '</span>' + 
						(typeof query === 'string' ? '<pre><code>' + query + '</code></pre>' : '')  +
					'</li>';

			$("#brackets-sql-connector-log-pane > ul").prepend(log);
		},

		add_result = function(fields, rows, query, error) {

			if ( error ) {
				add_log('Error', error);
				return;
			}

			if ( fields === null && typeof rows === 'object' ) {
				add_log(Strings.QUERY_COMPLETED + ": " + rows.message);
				CommandManager.execute(cmds.VIEW_LOG);
				return;
			}

			ids = ids + 1;
			var cid = ids,
				$pane = $(Mustache.render(queryResultSetTemplate, {
					Strings: Strings,
					Id: cid
				})),
				$tbl = $('table', $pane),
				i=0,il=fields.length,f,
				j=0,jl=rows.length,r,
				html = '';

				for(;i<il;i++) {
					f = fields[i];
					html += '<th>' + (f.name||f.Field) + '</th>';
				}
				$("thead", $tbl).html('<tr>'+html+'</tr>');
				html = '';

				for(;j<jl;j++) {
					html += '<tr>';
					r = rows[j];
					for(i = 0;i<il;i++) {
						f = fields[i];
						html += '<td>' + r[(f.name||f.Field)] + '</td>';
					}
					html += '</tr>';
				}
				$("tbody", $tbl).html(html);

				add_log(Strings.QUERY_COMPLETED + ' ' + fields.length + ' fields, ' + rows.length + ' rows');
				add_achor(cid);
				$("#brackets-sql-connector-log-pane").removeClass("active").siblings().removeClass('active');
				$("#brackets-sql-connector-log-pane").after($pane.addClass('active'));

			CommandManager.execute(cmds.OPEN_RESULT_PANE);
		};

	module.exports = {
		add: add_result,
		log: add_log
	};

});