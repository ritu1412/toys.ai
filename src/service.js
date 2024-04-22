import axios from "axios";

const token = process.env.REACT_APP_GENIE_TOKEN

const LUMA_HEADERS = {
    'Accept': '*/*',
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Origin': 'https://lumalabs.ai',
    'Referer': 'https://lumalabs.ai/',
    'Sec-CH-UA': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
};

export async function generateCreationOnLuma(textTo3dModelPrompt, accessToken = token) {
    LUMA_HEADERS['Authorization'] = `Bearer ${accessToken}`;
    try {
        let apiResponse = await axios.post("https://webapp.engineeringlumalabs.com/api/v3/creations",
            { "input": { "text": textTo3dModelPrompt, "type": "imagine_3d_one", "jobParams": { "seed": "714762322" } }, "client": "web" },
            { headers: LUMA_HEADERS }
        );
        apiResponse = apiResponse.data;
        const responseList = apiResponse["response"];
        const primaryTaskId = responseList[0];
        return primaryTaskId;
    } catch (error) {
        console.log(error);
        alert("Please refresh token");
    }
}

export async function getTaskStatusOnLuma(taskId, accessToken = token) {
    LUMA_HEADERS['Authorization'] = `Bearer ${accessToken}`;
    try {
        let apiResponse = await axios.get(
            `https://webapp.engineeringlumalabs.com/api/v3/creations/uuid/${taskId}`,
            { headers: LUMA_HEADERS }
        );
        apiResponse = apiResponse.data;
        const response = apiResponse["response"];
        const status = response["status"];
        let output = response["output"] ?? null;
        if (output !== null && output.length > 0) {
            output = output[1]["file_url"];
        }
        return { output, status };
    } catch (error) {
        alert("Please refresh token");
    }
}

export async function refreshToken(oldToken) {
    let apiResponse = await axios.post(
        "https://webapp.engineeringlumalabs.com/api/v2/auth/refresh",
        { "refreshToken": oldToken },
        { headers: LUMA_HEADERS }
    );
    apiResponse = apiResponse.data;
    const newToken = apiResponse["accessToken"];
    LUMA_HEADERS['Authorization'] = `Bearer ${newToken}`;
    return newToken;
}

export async function convertToSTL(taskId) {
    const requestBody = {
        "input": {
            "convert": {
                "export_stl": true
            },
            "type": "blender_convert",
            "uuid": taskId
        },
        "linkedCreations": [],
    }
    try {
        let apiResponse = await axios.post(
            "https://webapp.engineeringlumalabs.com/api/v3/creations/convert",
            requestBody,
            { headers: LUMA_HEADERS }
        );
        apiResponse = apiResponse.data;
        apiResponse = apiResponse["response"]["uploaded_files"][0]["file_url"];
        return apiResponse;
    } catch (error) {
        alert("Error converting to STL");
    }
}