/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */

define(function (require, exports) {
    'use strict';

    // Get module dependencies.
    var Dialogs = brackets.getModule('widgets/Dialogs'),
        // Extension modules.
        Strings = require('modules/Strings'),
        dataStorage = require('modules/DataStorageManager'),
        settingsDialogTemplate = require('text!../html/dialog-settings.html'),
        msgDialogTemplate = require('text!../html/dialog-message.html'),
        msgConfirmationTemplate = require('text!../html/dialog-confirmation.html'),

        // Variables.
        dialog,
        engines = {
            mysql: {
                port: 3306
            },
            mssql: {
                port: 1433
            },
            postgresql: {
                port: 5432
            }
        },
        isNewObject = false,
        itensToRemove = [];

    /**
     * Set each value of the preferences in dialog.
     */
    function setValues(values) {

    }

    /**
     * Initialize dialog values.
     */
    function init() {

    }

    /**
     * Creates new server object
     * @returns {object} Empty Server Object
     */
    function newServerObj() {
        isNewObject = true;
        return {
            __id: 0,
            name: "default",
            host: '',
            port: engines.mysql.port,
            user: '',
            password: '',
            database: '',
            confirmModifications: true,
            saveModifications: true,
            modifications: [],
			instanceName: undefined,
			trustedConnection: false
        };
    }

    /**
     * Update screen server list
     * @param {object} serverList array of servers
     */
    function updateList(selected_id) {
        var serverList = dataStorage.getSortedServerArray(),
			html = '', i =0,il=serverList.length, id, s;

        for (;i<il;i++) {
			s = serverList[i];
			id = s.__id;
            html += '<li data-id="' + id + '"' + (id == selected_id ? ' class="selected" ' : '') + '>' +
                s.name +
                '<a href="#" class="close">x</a>' +
                '</li>';
        }
        $("#brackets-sql-connector-server-list").html(html);
    }

    /**
     * Add server if __id === 0 otherwise updates it
     * @param {object} serverInfo Server Object
     */
    function saveServer(serverInfo) {
        var serverList = dataStorage.get('server_list');

        if (!serverList || serverList === null || serverList === undefined || serverList === '') {
            serverList = {
                selected_id: false,
                server_ids: 0,
                servers: {}
            };
        }

        if (parseInt(serverInfo.__id) === 0) {
            serverList.server_ids = serverList.server_ids + 1;
            serverInfo.__id = serverList.server_ids;
        }

        serverList.servers[serverInfo.__id] = serverInfo;
        serverList.selected_id = serverInfo.__id;

        $('.input-id', dialog.getElement()).val(serverInfo.__id);

        dataStorage.set('server_list', serverList);

        updateList(serverList.selected_id);
    }

    /**
     * Returned an filled server object from the from input s
     * @returns {object} Server Objected
     */
    function getFormInfo() {
        var $dialog = dialog.getElement();
        return {
            __id: $('.input-id', $dialog).val(),
            __connection_id: $('.input-connection-id', $dialog).val(),
            engine: $('.input-engine', $dialog).val(),
            name: $('.input-name', $dialog).val(),
            host: $('.input-host', $dialog).val(),
            port: $('.input-port', $dialog).val(),
            username: $('.input-username', $dialog).val(),
            password: $('.input-password', $dialog).val(),
            database: $('.input-database', $dialog).val(),
            confirmModifications: $('.input-confirm-modifications', $dialog).is(':checked'),
            saveModifications: $('.input-save-modifications', $dialog).is(':checked'),
			trustedConnection: $('.input-trusted-connection', $dialog).is(':checked'),
			instanceName: $('.input-instance-name', $dialog).val()
        };
    }

    /**
     * Resets form to new insertion
     */
    function clearForm() {
        isNewObject = true;
        var $dialog = dialog.getElement();
        $('input:text', $dialog).val('');
        $('.input-id', $dialog).val(0);
        $('.input-password', $dialog).val('');
        $('.input-connection-id', $dialog).val(0);
        $('.input-engine', $dialog)[0].selectedIndex = 0;
        $('.input-port', $dialog).val(engines.mysql.port);
        $('.input-confirm-modifications', $dialog).prop('checked', true);
        $('.input-save-modifications', $dialog).prop('checked', false);
        $('.input-trusted-connection', $dialog).prop('checked', false);
        $('.input-instance-name', $dialog).val('');
    }

    /**
     * Fills forms input for view/edit
     * @param {object} serverInfo [[Description]]
     */
    function fillForm(serverInfo) {
        isNewObject = false;
        var $dialog = dialog.getElement();
        if (serverInfo.uploadOnSave) {
            $('.input-save', $dialog).prop('checked', true);
        }
        $('.input-method', $dialog).val(serverInfo.method);
        $('.input-id', $dialog).val(serverInfo.__id);
        $('.input-connection-id', $dialog).val(serverInfo.__connection_id);
        $('.input-name', $dialog).val(serverInfo.name);
        $('.input-method', $dialog).val(serverInfo.method);
        $('.input-host', $dialog).val(serverInfo.host);
        $('.input-port', $dialog).val(serverInfo.port);
        $('.input-username', $dialog).val(serverInfo.username);
        $('.input-password', $dialog).val(serverInfo.password);
        $('.input-database', $dialog).val(serverInfo.database);
        $('.input-engine', $dialog).val(serverInfo.engine);

        $('.input-confirm-modifications', $dialog).prop('checked', serverInfo.confirmModifications!==true);
        $('.input-save-modifications', $dialog).prop('checked', serverInfo.saveModifications===true);

		if ( serverInfo.engine === 'mssql' ) {
        	$('.input-instance-name', $dialog).val(serverInfo.instanceName);
			$('.input-trusted-connection', $dialog).prop('checked', serverInfo.trustedConnection===true);
			$('div.ms-only', $dialog).show();
		}
		else {
        	$('.input-instance-name', $dialog).val('');
			$('.input-trusted-connection', $dialog).prop('checked', false);
			$('div.ms-only', $dialog).hide();
		}

        if (serverInfo.confirmModifications !== true) {

        } else {
            //$('.input-confirm-modifications', $dialog).prop('checked', 'checked');
        }
        if (serverInfo.saveModifications !== true) {
            //$('.input-save-modifications', $dialog).prop('checked', false);
        } else {
            //$('.input-save-modifications', $dialog).prop('checked', 'checked');
        }
    }

    /**
     * Exposed method to update footer status
     */
    exports.updateStatus = function (status) {
        if (dialog !== undefined) {
            $("label.test-connection-status", dialog.getElement()).html(status);
        }
    };

    /**
     * Exposed method to show dialog.
     */
    exports.showMessage = function (title, text, query) {
        var compiledTemplate = Mustache.render(msgDialogTemplate, {
            Strings: Strings,
            Message: {
                Title: title,
                Text: text,
                Query: query || ''
            }
        });
        Dialogs.showModalDialogUsingTemplate(compiledTemplate);
    };

    /**
     * Exposed method to show dialog.
     */
    exports.showConfirmation = function (title, text, query, callback) {
        var compiledTemplate = Mustache.render(msgConfirmationTemplate, {
            Strings: Strings,
            Message: {
                Title: title,
                Text: text,
                Query: query
            }
        });

        var dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);

        $(dialog.getElement()).on('click', 'button', function (evt) {
            var id = $(this).data('button-id');
            if (id === 'execute') {
                callback();
            }
        });
    };

    /**
     * Exposed method to show dialog.
     */
    exports.showDialog = function (opts) {
        var self = this,
            _defaults = {
                testConnection: undefined, // function(serverInfo)
                serverSelected: undefined, // function(serverInfo)
            };
        // Compile dialog template.
        var serverList = dataStorage.get('server_list'),
            selectedServerName = dataStorage.get('selected_server_name'),
            selectedServer = false;

        // Alreasy has list
        if (typeof serverList === 'object' && serverList.selected_id > -1) {
            selectedServer = serverList.servers[serverList.selected_id];
        }
        // No setup at all
        else {
            serverList = {
                selected_id: false,
                server_ids: 0,
                servers: {}
            };
        }

        if (!selectedServer) {
            selectedServer = newServerObj();
        }

        var compiledTemplate = Mustache.render(settingsDialogTemplate, {
            Strings: Strings,
            info: selectedServer
        });

        // Save dialog to variable.
        dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate, false);

        // Initialize dialog values.
        init();

        $('#brackets-sql-connector-server-list').off('click', 'li').on('click', 'li', function (evt) {
                var $li = $(this),
                    serverId = $(this).data('id'),
                    info = dataStorage.get('server_list'),
                    server = info.servers[serverId];

                $li.addClass('selected').siblings().removeClass('selected');
                fillForm(server);
            })
            .on('click', 'li > a.close', function (evt) {
                evt.stopPropagation();
                itensToRemove.push($(this).parent().data('id'));
                self.updateStatus(Strings.SETTINGS_DIALOG_SAVE_TO_APLLY);
                $(this).parent().remove();
            });

        fillForm(selectedServer);

        updateList(serverList.selected_id);

        // manually handle ESC Key and buttons because of autoDismiss = false
        $(dialog.getElement())
            .on('change', '.input-engine', function (evt) {
				var eng = $(this).val(), $d = $(dialog.getElement());
                if (isNewObject) {
                    $('.input-port', $d).val(engines[eng].port);
                }
				if ( eng === 'mssql' ) {
					$('.ms-only', $d).show();
				}
				else {
					$('.ms-only', $d).hide();
				}
            })
            .off('keyup')
            .on('keyup', function (evt) {
                if (evt.keyCode === 27) {
                    dialog.close();
                    itensToRemove = [];
                }
            })
            .off('click', 'button')
            .on('click', 'button', function (evt) {
                var buttonId = $(this).data('button-id');
                if (buttonId === 'ok') {
                    itensToRemove = [];
                    saveServer(getFormInfo());
                    dialog.close();
                } else if (buttonId === 'save') {
                    if (itensToRemove.length > 0) {
                        var list = dataStorage.get('server_list');
                        for (var i = 0, il = itensToRemove.length; i < il; i++) {
                            delete list.servers[itensToRemove[i]];
                            if (list.selected_id == itensToRemove[i]) {
                                list.selected_id = 0;
                            }
                        }
                        dataStorage.set('server_list', list);
                        itensToRemove = [];
                    } else {
                        saveServer(getFormInfo());
                    }
                    self.updateStatus(Strings.SETTINGS_DIALOG_SAVED);
                } else if (buttonId === 'test') {
                    opts.testConnection.call(self, getFormInfo());
                } else if (buttonId === 'new') {
                    clearForm();
                } else {
                    itensToRemove = [];
                    dialog.close();
                }
            });
    };
});
