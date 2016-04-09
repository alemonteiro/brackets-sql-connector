/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */

define(function (require, exports, module) {
    'use strict';

    var Strings = require('modules/Strings'),

        CommandManager = brackets.getModule('command/CommandManager'),
        Commands = brackets.getModule('command/Commands'),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        ProjectManager = brackets.getModule('project/ProjectManager'),
        WorkspaceManager = brackets.getModule('view/WorkspaceManager'),

        dataStorage = require('modules/DataStorageManager'),
        cmds = require('modules/SqlConnectorCommands'),

        // Mustache templates.
        modificationRowTemplate = require('text!html/tr-modification.html'),
        SqlTemplate = require('text!sql_query/modification_command.sql'),

        getModificationTrHtml = function (mod) {
            return Mustache.render(modificationRowTemplate, {
                Strings: Strings,
                Date: mod.date,
                Project: mod.project,
                File: mod.file,
                Script: mod.sql
            });
        },

        loadModifications = function (mods) {
            var html, i = 0,
                il = mods.length,
                mod;
            for (; i < il; i++) html = getModificationTrHtml(mods[i]) + html;
            $("#brackets-sql-connector-modifications-pane tbody").html(html);
        },

        addModificationTr = function (mod) {
            $("#brackets-sql-connector-modifications-pane tbody").prepend(getModificationTrHtml(mod));
        },

        /**
         * Save modification script
         * @param {int} id Server ID
         * @param {string} modification SQL Command
         * @param {string} file File were the command was executed
         */
        saveModification = function (id, sql, file) {
            var serverList = dataStorage.getSettings(),
                svr = dataStorage.getServer(id),
                prj = ProjectManager.getInitialProjectPath(),
                dt = new Date();
            if (svr) {
                var mod = {
                    date: dt.toLocaleDateString() + " " + dt.toLocaleTimeString(),
                    sql: sql,
                    file: file.replace(prj, ""),
                    project: prj
                };
                svr.modifications.push(mod);
                serverList.servers[id] = svr;
                dataStorage.saveSettings(serverList);
                addModificationTr(mod);
            }
        },

        getScript = function (id) {
            var server = dataStorage.getServer(id),
                response = false;
            if (server && server.modifications.length > 0) {
                response = '';
                for (var i = 0, il = server.modifications.length, m; i < il; i++) {
                    m = server.modifications[i];
                    response += Mustache.render(SqlTemplate, {
                        Strings: Strings,
                        Date: m.date,
                        Project: m.project,
                        File: m.file,
                        Script: m.sql
                    });
                }
                response = {
                    length: server.modifications.length,
                    sql: response
                };
            }
            return response;
        },

        remove = function(id, index) {
            var cfg = dataStorage.getSettings(),
                svr = dataStorage.getServer(id);

            if (svr) {
                svr.modifications.splice(index, 1);
                cfg.servers[id] = svr;
                dataStorage.saveSettings(cfg);
                return true;
            }
            return false;
        },

        reset = function(id) {
            var cfg = dataStorage.getSettings(),
                svr = dataStorage.getServer(id, cfg);

            if (cfg && svr) {
                cfg[svr.__id].modifications = [];
                dataStorage.saveSettings(cfg);
                return true;
            }
            return false;
        },
        resetUI = function() {
            $("#brackets-sql-connector-modifications-pane tbody").empty();
        };

    module.exports = {
        save: saveModification,
        load: loadModifications,
        getScript: getScript,
        reset: reset,
        remove: remove,
        resetUI: resetUI
    };

});
