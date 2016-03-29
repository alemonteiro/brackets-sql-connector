brackets-sql-connector
====================

Connect to your databases directly from brackets. Browser the schema with an right panel and be able to execute sql directly from the editor.

## Features ##

* V 0.3.1 Supports MySQL and MS SQL Server(>=2005)
* Browser Panel (shows tables, fields, views, functions and procedures)
* Run SQL Commands from editor (Alt+Enter execute current selecion or current open document)
* Result Sets Panel with log viewer
* Create and store multiple server connections (settings are not per project, same server can be used on any project)
* Multiple connections at once (but only one active for all editor)
* Status Bar Menu For Connect/Disconnect and change Active Editor Connection
* Store server settings in the brackets system preference file, not the root folder of your projects, so no worry about uploading your credentials to your git repo.

## Getting Started ##

1. Open Extension Manager by clicking the building-blocky icon on the right side of Brackets;
2. Search for SQL Browser;
3. Click Install;
4. Click the SQL Connector icon (database with gears) on the right toolbar to open the browser panel;
5. Click on the status bar label (Normally 'Not Connected') to open the Menu 
8. Shortcuts: 
    * (Ctrl-Alt-Enter / Cmd-Alt-Enter) execute current text selection or current active document;
    
## Restrictions / Not Implemented stuff / Buggy ##
	
* Only one connection can be used at a time for executing editor querys. In the future it will be one per editor.
* Only one database can be viewer per server setup. If you need multiple databases on the same server, create multiples server for now.
* The browser has no function other than listing the stuff for now, in the near future it'll open the function/view/procedure content on the editor.
* No SSL support yet

### Contributions And Attributions ###

* All those fabulous icons are given by freekpik: http://freepik.com
* MySQL Server Connections are made possible by https://www.npmjs.com/package/mysql
* MS SQL Server Connections are made possible by https://www.npmjs.com/package/mssql

## Notes for developers ##

This repo does not include required node modules! For extension developers, please run 

npm install

in the /node folder.

## Release Notes ##

### V 0.3.1 ###
* Added default port for MS SQL Server (1433)
* Bug Fixes
Browser panel not opening from pop menu
Indicator Stauts keep saying is connected after Disconnect All

### V 0.3.0 ###
* Added MS SQL Server support
* Show view/procedure/function code in editor when selecting it from browser panel
* Better re-establish last connections handling (not perfect tho)
* Added Open/Close Browser Panel on Menu
* Lots of code refactoring
* Fixed minor bugs
* Improved connected server style

V 0.2.0 - Fixed lots of bugs on interface due to last time renaming
V 0.1.0 - Probably some bugs =x - Should disconnect from server before closing brackets

## TODO ##

* Use node mysql connection pools
* Configurable one connection and result sets per editor


### TODO - Code Stuff ###

* Remove unused css rules / optmize css selectors and names
* I don't know... there's alway something to make it better
