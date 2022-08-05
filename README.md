# zpl-printer

This is a hack of an old fork for a bandaid to get get some sort of virtual zpl running for previewing zpl labels in development. 
currently hardcoded to run on 9100. Would be a nice app to rebuild with vue/react... 

- I'm refactoring the old (story of my life). Previous dev did a good job when it was built but that was likely early 2010s... a bit has changed since then :P 


---
Printing to QZ tray...

### Mac

- have qz installed ;)
- enable the CUPS web interface by opening your terminal and typing: `cupsctl WebInterface=yes`
- visit `localhost:631` in a browser
- Choose Administration
- Choose Add (or modify) your printer
- ensure you choose `sockey/jetdirect` as the connection protocol running on `localhost` or `127.0.0.1`
- click continue until you see a list entitled "Make" -> choose `Raw`
- save the printer
- Print away but remember the stock jetdirect port is 9100 so make sure the app is running on that port. Otherwise change as you need :)
