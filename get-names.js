const https = require("https");

const key = "AIzaSyA9CQKPSyS8SLhFtAiePVHXkheAPI64kOA";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
        try {
            const json = JSON.parse(data);
            console.log("Model Names:");
            json.models.forEach(m => console.log(m.name));
        } catch (e) {
            console.error("Error parsing JSON", e);
            console.log("Raw response:", data);
        }
    });
}).on("error", (err) => {
    console.error("Error fetching models", err);
});
