brackets-sql-connector
====================

Connect to your databases directly from brackets. Browser the schema with an right panel and be able to execute sql directly from the editor.

## Install

### Requirements ###

* NPM -> https://nodejs.org/en/download/ (Make sure you install WITH Node Package Manager)

* Npm is used to install the dependencies required to connect to each sql engine. This was added because of problems with large files on the brackets extension registry.

#### From Git

Use `Help -> Show Extension Folder` to go to the extensions dir, open the prompt there and run

```
git clone http://github.com/alemonteiro/brackets-sql-connector
```
Then go to `brackets-sql-connector/node` and run
```
npm install
```

#### From Brackets

Use the Menu  `File -> Extension Manager` and search for SQL Connector or SQL Browser and install it.

If you have NPM installed the extension will try to auto install the dependencies, you should see the status idication on the bottom panel.

If the modules aren't installed automatically you need to get them manually. Use Brackets menu  *`Help -> Show Extension Folder`*, go to *`brackets-sql-connector/node`* folder and open it on the prompt/command line and execute
```
npm install
```

You should see the modules being installed and will be good to go =)

## Usage ##

* Right click on the DataBase icon on the tool bar(right) to open the menu, left click opens the Browser Panel
* Left click on the connection icon on the satus bar(bottom) to open the menu

* Use the menu to manage and connect to servers
* Many connections can be active at once, they are shown on the menu and on the Browser Panel if open
* Only one connection can be set to recieve commands from the main editors, this 'editor connection' will be shown on the status bar and can be changed on the Menu -> Set Editor Connection (this is only shown if two or more connections are up)

### Executing from editor ###

* The connection shown on the status bar with an green icon is able to accept commands from the editor.
* Brackets Menu View -> Execute Current Document or Current Selection
* Extension Menu -> Execute Current Selection (Only shown when there's selected text)
* Extension Menu -> Execute Document (Only shown when the file is .sql)

#### Shortcuts: 
	* (Ctrl-Alt-Enter / Cmd-Alt-Enter) execute current text selection or current active document;

* When you hit Alt-Enter 
		1. If there's any text select it will try to run it (in any type of file)
		2. If no text is select but the active document is an .sql all content will be executed
		
#### Manage Servers

## Features ##

* V 0.6.0 SQL Query Hints starting to work the basic expected (need to enable by preference files -> sqlHints = true [default to false])
* V 0.5.0 (and latters) Supports MySQL, MS SQL Server(>=2005) and PostgreSQL
* Browser Panel (shows tables, fields, views, functions and procedures)
* Run SQL Commands from editor (Alt+Enter execute current selecion or current open document)
* Result Sets Panel with log viewer
* Create and store multiple server connections (settings are not per project, same server can be used on any project)
* Multiple connections at once (but only one active for all editor)
* Store modification scripts from each server
* Status Bar Menu For Connect/Disconnect and change Active Editor Connection
* Store server settings in the brackets system preference file, not the root folder of your projects, so no worry about uploading your credentials to your git repo.
* Connections are not per project. They are even maintained connected on project switch.
* Auto Install of dependecies

### Alternative Install - Full Package ###

If still having problems with NPM install you can download the full package and extract it to the brackects extension folder.

Full package download: http://alemonteiro.com.br/downloads/brackets-sql-connector.zip

  
## Stored Modifications ##

* There's a setting for saving executed SQLs that makes changes to the database incluing insert, update, delete, alter, change, remove, drop, create and modify
* Saved modifications are stored by server, not by project
* You can delete an saved modification

## SQL Hinting ##

Disabled by default and working only .sql files for now, enabled by preferences file: `"alemonteiro.bracketsSqlConnector.sqlHints": true`

Reload brackets after making disabling/enabling preferences.


If enabled hinting will cache the sql reference available for the engine (current only MySQL), the list of table names from the current connected database, and the field names for the viewed tables on the browser or used in a statement inside the current .sql file;

 Hints for 
 
* Basic sql commands like SELECT, ALTER, UPTADE and etc
* Tables names after an table command (like one of the aboves and FROM, JOIN, DELETE and etc)
* Fields names when using table alias or tables name prefix
* MySQL Reference Functions with basic description
 
 
 ## DataBase Compare ##
 
 In version 0.5.9 it will only strike tables that doesn't exist on that server.
 
 You must connect to both servers before starting the compare.
 
## Contributions And Attributions ##

* Those fabulous icons are given by freekpik: http://freepik.com
* MySQL Server Connections are made possible by https://www.npmjs.com/package/mysql
* MS SQL Server Connections are made possible by https://www.npmjs.com/package/mssql
* PG SQL Server Connections are made possible by https://www.npmjs.com/package/pg

* Auto Install by [@IgorNovozhilov](https://github.com/IgorNovozhilov)

## TODO ##

* Use pg and mssql connection pools
* Add SSL support
* Configurable one connection and result sets per editor
* Interface to config default extension settings
* Compare table fields and properties
* Allow connection without pre-selected database
* Add portuguese translation

## Release Notes ##

### v 0.6.1 (not published) ###

* Removed icon for the status bar indicator. The selected server name will be green if connected.
* Add listener to context menu on status bar indicator
* Compare now shows differences between columns names and types
* Added export tables option on the browser context menu

Code stuff

* Rearrenged default SQLs queries to return js style names
* Modified export/view funcionalities to read from pre-defined templates instead of hard-coded ones


### v 0.6.0 ###

* Added Trusted Connection and Instance Name support for MS SQL Server
* Added context menu from extension icon on the right panel
* Added initial database tables compare
* Improved experimental sql query hinting
	1. Hints for basic sql commands like SELECT, ALTER, UPTADE and etc
	2. Hints for tables names after an table command (like one of the aboves and FROM, JOIN, DELETE and etc)
	3. Hints for fields names when using table alias or tables name prefix ()
	4. Hints for MySQL Functions with basic description

Bug Fixes

* Context Menu Log and Result Set functions not working
* Removed default 'dark' style from server menu and result panel

##### v 0.5.8 #####

Bug Fixes

* Menu closing when on sub-menu hover 

##### v 0.5.7 #####

Bug Fixes

* Menu not closing on focus out
* 'Execute Current Selection' being shown when no connection is made but there's text selected

##### v 0.5.6 #####

* Reorganized menu with sub-menus
* Added Clear Log and Clear Result Panes commands

##### v 0.5.5 #####

* Indicator status label will go back to server name 10 seconds after displaying last query result or error
* Added time and server on each result set panel
* Added server and number of modifications on modifications tab
* Added 'table-striped' style to tables for default styling
* Changed log from list to table
* Compiled connection images state inside only one
* Removed some unused images and css styles

##### v 0.5.4 #####

* Added auto install of dependencies

Bug Fixes

* Removed custom colors and let the style be made by brackets.

##### v 0.5.3 #####

Bug Fixes

* Assumed default styles from brackets (all colors and background-colors from the extension css was removed and added the default 'panel' and 'dark' classes)

##### v 0.5.2 #####

Bug Fixes

* Added max-height to result panel

##### v 0.5.1 #####

* Started using connection pool for mysql 

Bug Fixes

* Fixed showing Settings Dialog when connection error occured.
* Fixed auto reconnecting even if there was not active connection last time.
* Fixed show full modification script not showing sql (dates and paths are ugly yet tho)

##### v 0.5.0 #####

* Added PostreSQL support
* Added SHOW Create e ALTER for Views
* Added view full modification script

Bug Fixes

* Fixed MySQL Views showing as tables on browser

##### v 0.4.2 #####

* Added minimal sql formatting for viewing MySQL Views/Functions/Stored Procedures that have no indentention
* Fixed pop menu closing without executing action on windows

##### v 0.4.1 #####

* Added context menu for refreshing browser itens and disconnecting from server

Bug Fixes

* Fixed duplicating saved modification 
* Fixed indicator stuck at "Executing..." after running updates

##### v 0.4.0 #####

* Added save modifications support
* Added preferences option to connect to last connection on brackets startup (no interface for it yet tho)

Bug Fixes

* Pop menu not closing when losing focus fixed
* Stopped trying to load children of columns on browser panel
* Added 'drop' as modification script

##### v 0.3.4 #####
* Adopted brackets extension toolbar icon guidelines: https://github.com/adobe/brackets/wiki/Extension-Icon-Guidelines
* Made result set and log text selectable

Bug Fixes

* Not showing number of fetched rows on bottom indicator after query error
* Querying not executing if "Confirm modifications" was set

##### v 0.3.3 #####

Bug Fixes

* Fixed execute from editor not working 

##### v 0.3.2 #####

Bug Fixes

* Fixed to tool bar icon not showing
* Fixed pop menu not showing when no setup existed
* Fixed test connection not working unless server settings was saved

##### v 0.3.1 #####
* Added default port for MS SQL Server (1433)

Bug Fixes

* Browser panel not opening from pop menu
* Indicator Stauts keep saying is connected after Disconnect All
* No editor connection after disconnect

##### v 0.3.0 #####
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

