# Multi Code Checker for C Language

Check C Code by your C compiler!

## Feature

You can register your using C compiler or static analysis tool to execute code checking on VSCode.<br/>
Code checking will be executed on C file seved and/or execute command from command palette. 

## Requirement

You should prepare the C compliler or static analysis tool that satisfies following condition:
- That can be executed on commandline.
- The result of compilation can be recieved by standard output.
- Each warning or error information in the result is regex parsable and having following information:
	- file name
	- line position
	- charactor position(not essential)
	- severity(not essential)

## Commands

`Multi Code Chekcer for C Languge: Check Code`: Execute code checking.



## Configurations

- `mcc.checkers.onSaved`: The array of `compiler information` that will be executed when a C file saved.
- `mcc.checkers.onCommand`: The array of `compiler information` that will be executed when the `Check Code` command fired.

`compiler information` is defined as following format:

```typescript
{
    compileCommand: string; // name of compile command
    maxNumberOfProblems: number; // limitation for the number of errors/warnings thart display on VSCode editor. 
    compileOptions: string[]; // array of compile options
    includeOptionPrefix: string; // prefix of include option
    includePath: {
        absolute: string[]; // array of include paths(absolute path)
        relative: string[]; // array of include paths(workspace relative path)
    }
    // we define "check information" as the set of following information:
    //  - file name
    //  - line position
    //  - charactor position
    //  - severity	
    diagDelimiter: string; // delimiter of error/warning message that devides into each "check information"
    parse: {
        encoding: string; // encoding for the compiler's output message
        // regex pattern for parsing each error/warning message
        // You must set the "groups" to obtain each information of "check information".
        diagInfoPattern: string;
        // the group index of above "check information"
        index: {
            file_name: number; // group index of file name 
            line_pos: number; // group index of line position
            char_pos: number; // group index of charactor position
            severity: number; // group index of severity
        }
        severityIdentifier: {
            error: string; // ID string indicates "error" level severity
            warning: string; // ID charactor indicates "warning" level severity
            information: string; // ID charactor indicates "information" level severity
            hint: string; // ID charactor indicates "hint" level severity
        }
    }
}
```

## Setting example

Following is an example for setting "gcc" as the checker:

```json
"mcc.checkers": {
	"onSaved": [{	
	    "maxNumberOfProblems": 100,
	    "compileCommand": "gcc",
	    "includeOptionPrefix": "-I",
	    "includePath" : {
		    "absolute": [],
		    "relative": [] 
	    },
	    "compileOptions": [
			"-fsyntax-only",
			"-Wall",
			"-fdiagnostics-parseable-fixits"
	    ],
	    "diagDelimiter": "^.+:[0-9]+:[0-9]+:",
	    "parse": {
		    "encoding": "utf-8",
		    "diagInfoPattern": "^(.+):([0-9]+):([0-9]+):\\s*(.+):.*",
		    "index": {
			    "file_name": 1,
			    "line_pos": 2,
			    "char_pos": 3,
			    "severity": 4
		    },
		    "severityIdentifier": {
			    "error": "error",
			    "warning": "warning",
			    "information":"information",
			    "hint":"hint"
		    }
	    } 
	}],
                    
    "onCommand": [{	
		"maxNumberOfProblems": 100,
		"compileCommand": "gcc",
		"includeOptionPrefix": "-I",
		"includePath" : {
		    "absolute": [],
		    "relative": [] 
		},
		"compileOptions": [
			"-fsyntax-only",
			"-Wall",
			"-fdiagnostics-parseable-fixits"
		],
		"diagDelimiter": "^.+:[0-9]+:[0-9]+:",
		"parse": {
			"encoding": "utf-8",
			"diagInfoPattern": "^(.+):([0-9]+):([0-9]+):\\s*(.+):.*",
			"index": {
				"file_name": 1,
				"line_pos": 2,
				"char_pos": 3,
				"severity": 4
			},
			"severityIdentifier": {
				"error": "error",
				"warning": "warning",
				"information":"information",
				"hint":"hint"
			}
		} 
	}]
}
```

## Release Note

### 0.0.1

First version for prototype.

### 0.0.2

- Enable to show the icon in status bar when checking code:

	![アイコン](img/progress_icon.png)

- Remove the result of checking when checked file is closed in the editor.

<br/>
<br/>
Happy vscoding!<br/>
Muraak.
