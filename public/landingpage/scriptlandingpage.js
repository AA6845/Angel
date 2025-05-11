document.addEventListener('DOMContentLoaded', () => {
    console.log("Landing Page bereit.");

    const startBtn = document.getElementById("startButton");
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            window.location.href = "/indexlogin.html";

        });
    }
});
