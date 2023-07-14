let session = null;

// Create specification for the time series topic
const TopicSpecification = diffusion.topics.TopicSpecification;
const TopicType = diffusion.topics.TopicType;
const JSONDataType = diffusion.datatypes.json();

const spec = new TopicSpecification(TopicType.TIME_SERIES, {
    TIME_SERIES_EVENT_VALUE_TYPE   : 'json',
    TIME_SERIES_RETAINED_RANGE     : 'limit 50',
    TIME_SERIES_SUBSCRIPTION_RANGE : 'limit 50'
});

//
// Helper function for connection to Diffusion
//
async function connectToDiffusion() {
    let host     = document.getElementById('diff_host').value;
    let port     = Number(document.getElementById('diff_port').value);
    let username = document.getElementById('diff_username').value;
    let password = document.getElementById('diff_password').value;

    return diffusion.connect({
        host        : host,
        port        : port,
        principal   : username,
        credentials : password
    });
}

//
// Load data from the supplied file.
//
async function loadFile() {
    let promise = new Promise(function(resolve, reject) {
        let file = document.getElementById('fileInput').files[0];
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function() {
            resolve(reader.result);
        }
    });

    return promise;
}

//
// Helper function to update the message count on the page.
//
function updateCount(count) {
    document.getElementById('msg_count').innerText = count;
}

//
// Helper function to connect to Diffusion and update UI elements.
//
async function connect() {
    if(session && session.isConnected()) {
        session.close();
    }
    else {
        session = await connectToDiffusion();
    }

    if(session.isConnected()) {
        document.getElementById('connection_state').src = 'connected.png';
        document.getElementById('btn_connect').value = 'Disconnect';
        document.getElementById('btn_publish').disabled = false;
    }
    else {
        document.getElementById('connection_state').src = 'disconnected.png';
        document.getElementById('btn_connect').value = 'Connect';
        document.getElementById('btn_publish').disabled = true;
    }
}

//
// Called when the user clicks the 'Begin publishing' button
//
async function publish() {
    // Add the time series topic
    let topicName = document.getElementById('diff_topic').value;
    session.topics.add(topicName, spec);

    // Load data from the selected file
    let data = await(loadFile());
    let lines = data.split('\n');
    lines = lines.map(line => line.trim());
    
    // Start updating the Diffusion topic
    let delay = Number(document.getElementById('delay').value);
    let count = 0;
    let interval = setInterval(() => {
        if(count === (lines.length - 1)) {
            console.log('Done');
            clearInterval(interval);
        }
        else {
            let line = lines[count++];
            session.topicUpdate.set(topicName, JSONDataType, JSON.parse(line))
                .then(() => {
                    updateCount(count);
                });
        }
    }, delay);
}
