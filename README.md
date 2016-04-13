brackets-sql-connector
====================

Connect to your databases directly from brackets. Browser the schema with an right panel and be able to execute sql directly from the editor.

## Features ##

* V 0.5.0 Supports MySQL, MS SQL Server(>=2005) and PostgreSQL
* Browser Panel (shows tables, fields, views, functions and procedures)
* Run SQL Commands from editor (Alt+Enter execute current selecion or current open document)
* Result Sets Panel with log viewer
* Create and store multiple server connections (settings are not per project, same server can be used on any project)
* Multiple connections at once (but only one active for all editor)
* Store modification scripts from each server
* Status Bar Menu For Connect/Disconnect and change Active Editor Connection
* Store server settings in the brackets system preference file, not the root folder of your projects, so no worry about uploading your credentials to your git repo.
* Connections are not per project. They are even maintained connected on project switch.

## Getting Started ##

1. Open Extension Manager by clicking the building-blocky icon on the right side of Brackets;
2. Search for SQL Browser or SQL Connector;
3. Click Install;
4. Click the SQL Connector icon (database with gears) on the right toolbar to open the browser panel;
5. Click on the status bar label (Normally 'Not Connected') to open the Menu 
8. Shortcuts: 
    * (Ctrl-Alt-Enter / Cmd-Alt-Enter) execute current text selection or current active document;
   
## Executing from editor ##

* On the bottom panel should be a green connection icon with yout server name in front of it.
* When you hit Alt-Enter 
1. If there's any text select it will try to run it (in any type of file)
2. If no text is select then only SQL Documents will be executed
   
## Stored Modifications ##

* There's a setting for saving executed SQLs that makes changes to the database incluing insert, update, delete, alter, change, remove, drop, create and modify
* Saved modifications are stored by server, not by project
* You can delete an saved modification

## Restrictions / Not Implemented stuff / Buggy ##
	
* Only one connection can be used at a time for executing editor querys. In the future it will be one per editor.
* Only one database can be viewer per server setup. If you need multiple databases on the same server, create multiples server for now.
* No SSL support yet
* The Browser panel hides the second editor scroll bar. (This panel is an "fix" cause brackets doesn't have API for side panels yet).

### Contributions And Attributions ###

* All those fabulous icons are given by freekpik: http://freepik.com
* MySQL Server Connections are made possible by https://www.npmjs.com/package/mysql
* MS SQL Server Connections are made possible by https://www.npmjs.com/package/mssql

## Notes for developers ##

This repo does not include required node modules! For extension developers, please run 

npm install

in the /node folder.

## TODO ##

* Use pg and mssql connection pools
* Configurable one connection and result sets per editor
* Better organize / divide menus (probably best submenus)
* Interface to config default extension settings

## Release Notes ##

### v 0.5.3 ###

Bug Fixes

* Assumed default styles from brackets (all colors and background-colors from the extension css was removed and added the default 'panel' and 'dark' classes)

### v 0.5.2 ###

Bug Fixes

* Added max-height to result panel

### v 0.5.1 ###

* Started using connection pool for mysql 

Bug Fixes

* Fixed showing Settings Dialog when connection error occured.
* Fixed auto reconnecting even if there was not active connection last time.
* Fixed show full modification script not showing sql (dates and paths are ugly yet tho)

### v 0.5.0 ###

* Added PostreSQL support
* Added SHOW Create e ALTER for Views
* Added view full modification script

Bug Fixes

* Fixed MySQL Views showing as tables on browser

### v 0.4.2 ###

* Added minimal sql formatting for viewing MySQL Views/Functions/Stored Procedures that have no indentention
* Fixed pop menu closing without executing action on windows

### v 0.4.1 ###

* Added context menu for refreshing browser itens and disconnecting from server

Bug Fixes

* Fixed duplicating saved modification 
* Fixed indicator stuck at "Executing..." after running updates

### v 0.4.0 ###

* Added save modifications support
* Added preferences option to connect to last connection on brackets startup (no interface for it yet tho)

Bug Fixes

* Pop menu not closing when losing focus fixed
* Stopped trying to load children of columns on browser panel
* Added 'drop' as modification script

### v 0.3.4 ###
* Adopted brackets extension toolbar icon guidelines: https://github.com/adobe/brackets/wiki/Extension-Icon-Guidelines
* Made result set and log text selectable

Bug Fixes

* Not showing number of fetched rows on bottom indicator after query error
* Querying not executing if "Confirm modifications" was set

### v 0.3.3 ###

Bug Fixes

* Fixed execute from editor not working 

### v 0.3.2 ###

Bug Fixes

* Fixed to tool bar icon not showing
* Fixed pop menu not showing when no setup existed
* Fixed test connection not working unless server settings was saved

### v 0.3.1 ###
* Added default port for MS SQL Server (1433)

Bug Fixes

* Browser panel not opening from pop menu
* Indicator Stauts keep saying is connected after Disconnect All
* No editor connection after disconnect

### v 0.3.0 ###
* Added MS SQL Server support
* Show view/procedure/function code in editor when selecting it from browser panel
* Better re-establish last connections handling (not perfect tho)
* Added Open/Close Browser Panel on Menu
* Lots of code refactoring
* Fixed minor bugs
* Improved connected server style

##### v 0.2.0 #####
* Fixed lots of bugs on interface due to last time renaming

##### v 0.1.0 #####
* Probably some bugs =x 
* Should disconnect from server before closing brackets

