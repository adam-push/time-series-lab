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
//
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
        document.getElementById('btn_subscribe').disabled = false;
        document.getElementById('btn_query').disabled = false;
    }
    else {
        document.getElementById('connection_state').src = 'disconnected.png';
        document.getElementById('btn_connect').value = 'Connect';
        document.getElementById('btn_subscribe').disabled = true;
        document.getElementById('btn_query').disabled = true;
    }
}

function updateTable(tableId, event, truncate) {
    let table = document.getElementById(tableId);
    let tbody = table.getElementsByTagName('tbody')[0];

    if(truncate) {
        while(tbody.rows.length > 10) {
            tbody.deleteRow(10);
        }
    }
    
    let data = `<td>${event.sequence}</td><td>${event.timestamp}</td><td>${event.value}</td>`

    let newRow = tbody.insertRow(0);
    newRow.innerHTML = data;
}

function subscribe() {
    let topic = document.getElementById('diff_topic_sub').value;

    let stream = session.addStream(topic, diffusion.datatypes.timeseries(JSONDataType))
    stream.on({
        'value' : (topic, spec, event) => {
            updateTable('subscription_table', event, true);
        }});

    session.select(topic);
}

function query() {
    let topic = document.getElementById('diff_topic_query').value;

    const queryResult = session.timeseries.rangeQuery()

    // adjust number to number of events
    // .fromLast(10)

    // for a range of values
    // .from(37).to(39)

    // from start
          .fromStart().next(10)

          .as(diffusion.datatypes.json())
          .selectFrom(topic)
          .then(results => {
              results.events.forEach(evt => {
                  updateTable('query_table', evt);
              })});
}
