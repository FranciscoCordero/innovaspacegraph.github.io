import { InfluxDB } from 'https://unpkg.com/@influxdata/influxdb-client/dist/index.browser.mjs';

const url = "https://us-east-1-1.aws.cloud2.influxdata.com";
const token = "M-6re7Lt3UZM6juFPHnewKleXVmFQca55Sf5JwEq9BeY9_epkb9fjz6F6wbJWhe8T5eVph9_ttqTezvHO3TlWQ==";
const influxBucket = "telemetria";
const influxORG = "innova.groundstation@gmail.com";
const queryAPI = new InfluxDB({ url, token }).getQueryApi(influxORG);

function getMeasurements() {
    const query = `import \"influxdata/influxdb/schema\" schema.measurements(bucket: \"${influxBucket}\")`                   /* Function to get Measurements */
    fillListWithData('_m-list', query);
};

function getSelectedMeasurements() {
    clearList('#_f-list');
    const measurement_ = $("#_m-list").val();                                                                                 /* Function to get Fields */
    var query =
            `import \"influxdata/influxdb/schema\"                                                                              
        schema.measurementFieldKeys(bucket: \"${influxBucket}\",
        measurement: \"${measurement_}\")
        |> yield(name: \"${measurement_}\")`
        fillListWithData('_f-list', query);

}

function fillListWithData(list_, query) {                                                                           
    var list = document.getElementById(list_.toString()),                                                                   /* Function to create Fields list */
        option,
        result = [];

    const fluxObserver = {
        next(row, tableMeta) {
            result.push(tableMeta.toObject(row)._value);
        },
        error() {
            console.log('\nFinished ERROR')
        },
        complete() {
            result.forEach((m_) => {
                option = document.createElement('option');
                option.text = m_;
                list.appendChild(option);
            })
        }
    }
    queryAPI.queryRows(query, fluxObserver)
}
async function getData() {
    var results_ = [];
    var startDate = (new Date(document.getElementById("datepicker1").value).valueOf()) / 1000,                      /* Function to get Graph Data */
        endDate = (new Date(document.getElementById("datepicker2").value).valueOf()) / 1000;
    var selectedMeasurements = $("#_m-list").val();
    var selectedFields = $("#_f-list").val();
    var query = "";
        selectedFields.forEach((fields_) => {
            query = `from(bucket: \"${influxBucket}\")  
                    |> range(start: ${startDate}, stop: ${endDate} ) 
                    |> filter(fn: (r) => r[\"_measurement\"] == \"${selectedMeasurements}\")
                    |> filter(fn: (r) => r[\"_field\"] == \"${fields_}\")`;      
            results_.push(getGraphData(query));
        });
    return results_;
}

function clearList(list_) {
    $(list_.toString()).empty();
}

function getGraphData(query) {
    var result = [];
    const fluxObserver = {
        next(row, tableMeta) {
            result.push(tableMeta.toObject(row)._value);
        },
        error(error) {
            console.error(error)
        },
        complete() {    
            result.length > 0 ? result : console.log('empty data');
        }
    }
    queryAPI.queryRows(query, fluxObserver);
    return result;
};

async function listsPush() {
    var lists = $("#_f-list").val();                                                                                /* Function to push Labels and Data to the Graph */
    await getData()
    .then( (result) => {
        for (let i = 0; i < lists.length; i++) {
            addData(myChart, lists[i], getRandomRgb(), getRandomRgb(), result[i]);
        }
    })
}

function datesPush(){
    var dates = [];                                                                                                /* Function to push dates to the Graph */
    var startDate = new Date(document.getElementById("datepicker1").value),
        endDate = new Date(document.getElementById("datepicker2").value);

    while (startDate < endDate){
        dates.push(startDate.toISOString().slice(0, 10));
        startDate.setDate(startDate.getDate()+1);
    };
    dates.forEach((date) => {
        addDates(date);
    });
}

function scrollToView(){
    const graph = document.getElementById('btnPopup');
    graph.scrollIntoView();
}

function chartReset(){
    myChart.destroy();
}

function render(){
    myChart = new Chart(document.getElementById('myChart'),config);
}

window.addEventListener('load', getMeasurements); 
document.getElementById('_m-list').addEventListener('click', getSelectedMeasurements);
document.getElementById('btnPopup').addEventListener('click', listsPush);
document.getElementById('btnPopup').addEventListener('click', datesPush);
document.getElementById('btnPopup').addEventListener('click', scrollToView);
document.getElementById('btnPopup').addEventListener('click', chartReset);
document.getElementById('btnPopup').addEventListener('click', render);
