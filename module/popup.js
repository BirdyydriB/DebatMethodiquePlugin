// execute the script now so it can listen to the messages sent by the code below
browser.tabs.executeScript(null, { file: "/bin/debatmethodique.js" }).then(() => {
});

document.addEventListener("click", (e) => {
  if(e.target.classList.contains("answer")) {
    var answer = e.target.textContent;
    var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
    gettingActiveTab.then((tabs) => {
			var response = browser.tabs.sendMessage(tabs[0].id, {answer: answer});
		// window.close();
    });
  }
});
