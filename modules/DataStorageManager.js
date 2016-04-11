/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */
/*!
 * SQL Connector & Browser 0.3.0
 *
 * @author Alê Monteiro
 * @license MIT
 * @home https://github.com/alemonteiro/brackets-sql-connector
 */
define( function( require, exports, module ) {
    'use strict';

    // Get dependencies.
    var extensionUtils = brackets.getModule( 'utils/ExtensionUtils' ),
        //_                 = brackets.getModule("thirdparty/lodash"),
        FileSystem        = brackets.getModule("filesystem/FileSystem"),
        ProjectManager = brackets.getModule( 'project/ProjectManager' ),
        FileUtils         = brackets.getModule("file/FileUtils"),
        PreferencesManager = brackets.getModule( 'preferences/PreferencesManager' ),
        preferences = PreferencesManager.getExtensionPrefs( 'alemonteiro.bracketsSqlConnector' );

    var self = this,
        propertyList = {},
        projectUrl = '';

    function init(callback){

    }

    function get(key){
        return preferences.get(key);
    }

    function set(key, value){
        preferences.set(key, value);
    }

    function setByproject(key, value){
        if(!(projectUrl+'|'+key in propertyList)){
            preferences.definePreference(projectUrl+'|'+key, 'string', '');
            propertyList[projectUrl+'|'+key] = true;
        }
        preferences.set(projectUrl+'|'+key, value);
    }
	
    function getByProject(key, value){
		
		projectUrl = ProjectManager.getProjectRoot().fullPath;
        return preferences.get(projectUrl+'|'+key);
    }

    function getSettings() {
        var serverInfo = get('server_list');
		if ( serverInfo === undefined || serverInfo === false || serverInfo === null || serverInfo === "" ) {
			return {
                selected_id: false,
                server_ids: 0,
                servers: {}
			};
		}
		return serverInfo;
    }

    function saveSettings(cfg) {
        set('server_list', cfg);
    }

	function getServer(serverId, cfg) {
		cfg = cfg || getSettings();
		if ( cfg && (cfg.servers[serverId] !== undefined || cfg.servers[cfg.selected_id] !== undefined) ) {
            var srv = cfg.servers[serverId || cfg.selected_id];
            if (srv.modifications === undefined) {
                srv.modifications = [];
            }
            if ( srv.saveModifications === undefined ) {
                srv.saveModifications = false;
            }
            return srv;
		}
		return false;
	}

    function setCurrentServer(serverId) {
        var cfg = getSettings();
		if ( !cfg ) return false;
        if ( serverId === false || serverId === undefined || cfg.servers[serverId] === undefined) {
			cfg.selected_id = 0;
            for(var s in cfg.servers) {
                cfg.servers[s].__connection_id = 0;
            }
			saveSettings(cfg);
			return false;
		}
		cfg.selected_id = serverId;
        cfg.servers[serverId].__connection_id = serverId;
		saveSettings(cfg);
        return true;
    }

    exports.set = set;
    exports.get = get;
    exports.getSettings =  getSettings;
    exports.saveSettings =saveSettings;
    exports.getServer =  getServer;
    exports.setCurrentServer = setCurrentServer;
});
