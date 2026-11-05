// Scales the 1920x1080 launcher frame to the screen's width and centres it (frame.html)
(function () {
	const tv = document.getElementById("tv");
	function fit() {
		const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
		const left = (innerWidth - 1920 * scale) / 2;
		const top = (innerHeight - 1080 * scale) / 2;
		tv.style.transform = "translate(" + left + "px," + top + "px) scale(" + scale + ")";
		window.simframe = {scale: scale, left: left, top: top};
	}
	addEventListener("resize", fit);
	fit();
	tv.addEventListener("load", () => tv.contentWindow.focus());
})();
