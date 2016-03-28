define( function( require, exports, module ) {
    'use strict';

    // Get dependencies.
    var extensionUtils = brackets.getModule( 'utils/ExtensionUtils' ),
        //_                 = brackets.getModule("thirdparty/lodash"),
        FileSystem        = brackets.getModule("filesystem/FileSystem"),
        ProjectManager = brackets.getModule( 'project/ProjectManager' ),
        FileUtils         = brackets.getModule("file/FileUtils"),
        PreferencesManager = brackets.getModule( 'preferences/PreferencesManager' ),
        preferences = PreferencesManager.getExtensionPrefs( 'alemonteiro.bracketsMySQLBrowser' );

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
	
    function _save(){
		
    }

    exports.get = get;
    exports.set = set;
	
});
