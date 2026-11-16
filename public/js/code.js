/* exported doLogin, readCookie, doLogout, addColor, searchColor */
const urlBase = 'http://wilsonvuproject.xyz/LAMPAPI';
const extension = 'php';

let userId = 0;
let firstName = "";
let lastName = "";

// Matches the VARCHAR(50) Name column in the Colors table.
const MAX_COLOR_LENGTH = 50;

// Checks a color typed by the user before it is sent to AddColor.php.
// Returns { valid, color, error }, where color is the trimmed input.
function validateColor(input)
{
	let color = (typeof input === "string") ? input.trim() : "";

	if( color.length === 0 )
	{
		return { valid: false, color: color, error: "Please enter a color" };
	}

	if( color.length > MAX_COLOR_LENGTH )
	{
		return { valid: false, color: color, error: "Color name must be " + MAX_COLOR_LENGTH + " characters or less" };
	}

	return { valid: true, color: color, error: "" };
}

// Makes text safe to put into innerHTML, so a color named "<b>Red</b>"
// shows up as that text instead of being treated as HTML.
function escapeHtml(text)
{
	return String(text)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

// Turns the results array from SearchColors.php into HTML, one color per line.
// SearchColors.php leaves out "results" when nothing matches, so anything
// that is not an array becomes an empty list.
function formatColorList(results)
{
	if( !Array.isArray(results) )
	{
		return "";
	}

	return results.map(escapeHtml).join("<br />\r\n");
}

// Reads the login cookie written by saveCookie(), which looks like
// "firstName=Test,lastName=User,userId=1". userId is -1 when there is no
// valid login. Other cookies (separated by ";") are ignored.
function parseCookie(cookieString)
{
	let user = { firstName: "", lastName: "", userId: -1 };
	let splits = (cookieString || "").split(/[,;]/);

	for( let i = 0; i < splits.length; i++ )
	{
		let tokens = splits[i].trim().split("=");
		if( tokens[0] == "firstName" )
		{
			user.firstName = tokens[1];
		}
		else if( tokens[0] == "lastName" )
		{
			user.lastName = tokens[1];
		}
		else if( tokens[0] == "userId" )
		{
			let id = parseInt( tokens[1], 10 );
			user.userId = isNaN(id) ? -1 : id;
		}
	}

	return user;
}

function doLogin()
{
	userId = 0;
	firstName = "";
	lastName = "";
	
	let login = document.getElementById("loginName").value;
	let password = document.getElementById("loginPassword").value;
//	var hash = md5( password );
	
	document.getElementById("loginResult").innerHTML = "";

	let tmp = {login:login,password:password};
//	var tmp = {login:login,password:hash};
	let jsonPayload = JSON.stringify( tmp );
	
	let url = urlBase + '/Login.' + extension;

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		xhr.onreadystatechange = function() 
		{
			if (this.readyState == 4 && this.status == 200) 
			{
				let jsonObject = JSON.parse( xhr.responseText );
				userId = jsonObject.id;
		
				if( userId < 1 )
				{		
					document.getElementById("loginResult").innerHTML = "User/Password combination incorrect";
					return;
				}
		
				firstName = jsonObject.firstName;
				lastName = jsonObject.lastName;

				saveCookie();
	
				window.location.href = "color.html";
			}
		};
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		document.getElementById("loginResult").innerHTML = err.message;
	}

}

function saveCookie()
{
	let minutes = 20;
	let date = new Date();
	date.setTime(date.getTime()+(minutes*60*1000));	
	document.cookie = "firstName=" + firstName + ",lastName=" + lastName + ",userId=" + userId + ";expires=" + date.toGMTString();
}

function readCookie()
{
	let user = parseCookie( document.cookie );
	userId = user.userId;
	firstName = user.firstName;
	lastName = user.lastName;

	if( userId < 0 )
	{
		window.location.href = "index.html";
	}
	else
	{
//		document.getElementById("userName").innerHTML = "Logged in as " + firstName + " " + lastName;
	}
}

function doLogout()
{
	userId = 0;
	firstName = "";
	lastName = "";
	document.cookie = "firstName= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
	window.location.href = "index.html";
}

function addColor()
{
	document.getElementById("colorAddResult").innerHTML = "";

	let check = validateColor( document.getElementById("colorText").value );
	if( !check.valid )
	{
		document.getElementById("colorAddResult").innerHTML = check.error;
		return;
	}

	let tmp = {color:check.color,userId: userId};
	let jsonPayload = JSON.stringify( tmp );

	let url = urlBase + '/AddColor.' + extension;
	
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		xhr.onreadystatechange = function() 
		{
			if (this.readyState == 4 && this.status == 200) 
			{
				document.getElementById("colorAddResult").innerHTML = "Color has been added";
			}
		};
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		document.getElementById("colorAddResult").innerHTML = err.message;
	}
	
}

function searchColor()
{
	let srch = document.getElementById("searchText").value;
	document.getElementById("colorSearchResult").innerHTML = "";

	let tmp = {search:srch,userId:userId};
	let jsonPayload = JSON.stringify( tmp );

	let url = urlBase + '/SearchColors.' + extension;
	
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		xhr.onreadystatechange = function() 
		{
			if (this.readyState == 4 && this.status == 200) 
			{
				let jsonObject = JSON.parse( xhr.responseText );

				if( jsonObject.error )
				{
					document.getElementById("colorSearchResult").textContent = jsonObject.error;
					document.getElementsByTagName("p")[0].innerHTML = "";
					return;
				}

				document.getElementById("colorSearchResult").innerHTML = "Color(s) has been retrieved";
				document.getElementsByTagName("p")[0].innerHTML = formatColorList( jsonObject.results );
			}
		};
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		document.getElementById("colorSearchResult").innerHTML = err.message;
	}

}

// Lets Jest load these functions with require(). Browsers skip this block
// because `module` only exists in Node.
if( typeof module !== "undefined" && module.exports )
{
	module.exports = { MAX_COLOR_LENGTH, validateColor, escapeHtml, formatColorList, parseCookie };
}
