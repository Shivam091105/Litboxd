window.onload = function(){
    console.log("Site Loaded");
}

document.onkeydown = () => console.log("Key Down");
document.onkeyup = () => console.log("Key Up");

document.onclick = () => console.log("Mouse Click");
document.onmouseover = () => console.log("Mouse Hover");


// //Welcome
// window.addEventListener("load", function () {

//     let username = localStorage.getItem("username");

//     // If username does not exist, ask user
//     if (!username) {
//         username = prompt("Welcome to LitCircle! Enter your name:");

//         if (username && username.trim() !== "") {
//             localStorage.setItem("username", username);
//             alert("Welcome, " + username + "!");
//         }
//     }

// });


// //Review Form   
// window.onload = function () {

//     const form = document.getElementById("reviewForm");

//     if (form) {

//         form.addEventListener("submit", function (event) {

//             event.preventDefault(); // stop default submission

//             const name = document.querySelector("input[type='text']").value;
//             const review = document.querySelector("textarea").value;
//             const rating = document.querySelector("input[name='rate']:checked");

//             if (name.trim() === "") {
//                 alert("Name cannot be empty.");
//                 return;
//             }

//             if (!rating) {
//                 alert("Please select a rating.");
//                 return;
//             }

//             if (review.length < 20) {
//                 alert("Review must be at least 20 characters long.");
//                 return;
//             }

//             alert("Review submitted successfully!");
//             form.reset();
//         });
//     }
// };


// // profile name-change
// window.addEventListener("DOMContentLoaded", function () {

//     let storedName = localStorage.getItem("username");

//     if (storedName) {
//         let userElement = document.getElementById("user");

//         if (userElement) {
//             userElement.textContent = storedName;
//         }
//     }

// });

// Run after DOM loads
document.addEventListener("DOMContentLoaded", function () {

    console.log("Script loaded successfully");

    let storedName = localStorage.getItem("username");

    // HOMEPAGE WELCOME PROMPT
    if (!storedName) {
        let name = prompt("Welcome to LitCircle! Enter your name:");

        if (name && name.trim() !== "") {
            localStorage.setItem("username", name);
            alert("Welcome, " + name + "!");
            storedName = name;
        }
    }

    // PROFILE PAGE USERNAME UPDATE
    let userElement = document.getElementById("user");

    if (userElement && storedName) {
        userElement.textContent = storedName;
    }

});


// CHANGE USERNAME BUTTON FUNCTION
function changeUsername() {

    let newName = prompt("Enter your new username:");

    if (newName && newName.trim() !== "") {
        localStorage.setItem("username", newName);
        document.getElementById("user").textContent = newName;
        alert("Username updated successfully!");
    } else {
        alert("Invalid username.");
    }

}

