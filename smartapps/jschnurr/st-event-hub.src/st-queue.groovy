/**
 *  Azure Queues
 *
 *  Copyrigth 2020 Jeff Schnurr
 *    ** based off of the 2017 work of Sam Cogan
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License. You may obtain a copy of the License at:
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
 *  for the specific language governing permissions and limitations under the License.
 *
 */
definition(
    name: 'ST-Queue',
    namespace: 'jschnurr',
    author: 'Jeff Schnurr',
    description: 'Smartthings Azure Queue Integration',
    category: 'My Apps',
    iconUrl: 'https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience.png',
    iconX2Url: 'https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png',
    iconX3Url: 'https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png') {
    appSetting 'StorageAccount'
    appSetting 'Queue'
    appSetting 'SASToken'  // allowed services: Queue, Allowed Resource Types: Object, Allowed Permissions: Add
    }

preferences {
    section('Power Meter') {
        input 'powers', 'capability.powerMeter', title: 'Power Sensor', multiple: true, required: false
    }
    section('Environment') {
        input 'temperatures', 'capability.temperatureMeasurement', title: 'Temperature Sensors', multiple: true, required: false
    }
    section('Security Sensors') {
        input 'motions', 'capability.motionSensor', title: 'Motion Sensors', multiple: true, required: false
    }
    section('Switches') {
        input 'switches', 'capability.switch', title: 'Switches', multiple: true, required: false
    }
    section('Acceleration Sensors') {
        input 'acceleration sensors', 'capability.accelerationSensor', title: 'Acceleration Sensors', multiple: true, required: false
    }
    section('Contact Sensors') {
        input 'contact sensors', 'capability.contactSensor', title: 'Contact Sensors', multiple: true, required: false
    }
    section('Buttons') {
        input 'buttons', 'capability.button', title: 'Buttons', multiple: true, required: false
    }
}

def installed() {
    log.debug "Installed with settings: ${settings}"

    initialize()
}

def updated() {
    log.debug "Updated with settings: ${settings}"

    unsubscribe()
    initialize()
}

def initialize() {
    subscribe(powers, 'power', powerHandler)
    subscribe(temperatures, 'temperature', temperatureHandler)
    subscribe(motions, 'motion', motionHandler)
    subscribe(contacts, 'contact', contactHandler)
    subscribe(switches, 'switch', switchHandler)
}

def sendEvent(evt, sensorType) {
    log.debug "sending ${evt.deviceId} at ${evt.value}"
    def now = new Date().format('yyyyMMdd-HH:mm:ss.SSS', TimeZone.getTimeZone('UTC'))
    def payload = buildEventMessage(evt, sensorType)
    def params = [
        uri: "https://${appSettings.StorageAccount}.queue.core.windows.net/${appSettings.Queue}/messages${appSettings.SASToken}",
        body: "<QueueMessage><MessageText>${payload}</MessageText></QueueMessage>",
        contentType: 'application/xml; charset=utf-8',
        requestContentType: 'application/atom+xml;type=entry;charset=utf-8',
        headers: ['x-ms-date': now],
    ]

    try {
        httpPost(params) { resp ->
            log.debug "response message ${resp}"
        }
    } catch (e) {
        // successful creates come back as 200, which ST sees as an error?
        log.error "something went wrong: $e"
        }
    }

private buildEventMessage(evt, sensorType) {
  def key = evt.displayName.trim()+ ":" +evt.name
  def payload = [
        date: evt.isoDate,
        hub: evt.hubId,
        deviceId: evt.deviceId,
        deviceType: sensorType,
        eventId: evt.id,
        key: key,
        device: evt.displayName.trim(),
        property: evt.name.trim(),
        value: evt.value,
        source: evt.source,
        location: evt.location
  ]
    def attribs = ""
    def sep = ''
    payload.each { k, v ->
      k = k.replaceAll('"', '\"')
      v = "${v}".replaceAll('"', '\"')
      attribs += "${sep}\"${k}\":\"${v}\""
      sep = ','
    }
    def jsonstr = '{'+attribs+'}'
    log.debug "JSON payload: ${jsonstr}"
    return jsonstr
}


def powerHandler(evt) {
    sendEvent(evt, 'powerMeter')
}

def temperatureHandler(evt) {
    sendEvent(evt, 'temperature')
}

def motionHandler(evt) {
    sendEvent(evt, 'motion')
}

def contactHandler(evt) {
    sendEvent(evt, 'contact')
}

def switchHandler(evt) {
    sendEvent(evt, 'switch')
}
