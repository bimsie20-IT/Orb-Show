<script setup>
import { ref } from 'vue'
import chroma from 'chroma-js'
import Podium from './components/Podium.vue'
import Paneel from './components/Paneel.vue'
const XMLparser = new DOMParser
const XMLserializer = new XMLSerializer()

const props = defineProps(['inhoud', 'padNaarBestand', 'refreshRate'])

// De inhoud van het bestand parsen naar XML
const inhoud = XMLparser.parseFromString(props.inhoud, 'text/xml')

// De XML elementen inlezen en definieren
const orbShow = inhoud.getElementsByTagName('orbShow')[0]
const stage = orbShow.getElementsByTagName('stage')[0]
const effectenLijst = stage.getElementsByTagName('effects')[0].childNodes

/* Opslaan van het bestand */

const saveBestand = async (effecten) => {
    // De vorige effecten van de inhoud wissen
    effectenLijst.forEach(effect => {
        inhoud.getElementsByTagName('effects')[0].removeChild(effect)
    })

    // De effecten toevoegen aan de inhoud van het bestand
    effecten.forEach(({ dropId, effect }) => {
        // Het root element van het effect
        const effectXML = inhoud.createElement('effect')

        // De samenhangende drop-id als attribuut meegeven
        effectXML.setAttribute('dropid', dropId)

        // Het effecttype
        const effectType = inhoud.createElement('type')
        const effectTypeTekst = inhoud.createTextNode(effect.effectType)
        effectType.appendChild(effectTypeTekst)
        effectXML.appendChild(effectType)

        // De parameters voor het effect te kunnen uitvoeren
        const parameters = inhoud.createElement('params')
        effectXML.appendChild(parameters)
        const params = effect.params
        Object.keys(params).forEach(paramKey => {
            const element = inhoud.createElement(paramKey)
            const tekst = inhoud.createTextNode(params[paramKey])
            element.appendChild(tekst)
            parameters.appendChild(element)
        })

        // Alles samenplakken aan de oorspronkelijke inhoud
        inhoud.getElementsByTagName('effects')[0].appendChild(effectXML)
    })

    // Het XML object serializeren naar een string
    const inhoudString = XMLserializer.serializeToString(inhoud)

    // Het bestand opslaan
    await electronAPI.saveBestand(inhoudString, props.padNaarBestand)
}

/* *********************** */

/* Reactive element voor het podium */

// Hoe het podium eruit ziet wanneer de main loop niet draait
const podiumStart = {
    plafondLampKleuren: [ '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff' ],
    achterdoekKleuren: [
        '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000',
        '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000',
        '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000',
        '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000',
        '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000',
        '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000'
    ]
}

const podium = ref(podiumStart)

const resetPodium = () => {
    animatieFrames.forEach(frame => {
        cancelAnimationFrame(frame)
    })
    animatieFrames = []
    podium.value.plafondLampKleuren.forEach((kleur, index) => {
        podium.value.plafondLampKleuren[index] = '#ffffff'
    })
}

/* ******************************** */

/* Functies voor het uitvoeren van effecten op het podium */

// Deze functie controleert welk effect er moet uitgevoerd worden
const checkEffect = (effect) => {
    switch (effect.effectType) {
        case 'color_shift':
            colorShiftEffect(effect.params.color, effect.params.duration, effect.params.spots)
            break
    }
}

/*
We bewaren de ingestelde animaties op,
zodat we ze later kunnen annuleren als de gebruiker op stop drukt
*/
let animatieFrames = []

// Deze functie fade een naar een bepaalde kleur vanaf een gegeven startkleur
const colorShiftEffect = (eindKleur, duur, spots) => {
    spots.forEach((spot, index) => {
        if (spot) {
            const startKleur = podium.value.plafondLampKleuren[index]

            // Voor elke seconden zijn 60 frames nodig voor vloeiende bewegingen
            const aantalStappen = duur * props.refreshRate

            const kleuren = chroma.scale([startKleur, eindKleur]).colors(aantalStappen);

            // Functie om de huidige kleur op te halen op basis van de frame-index
            const getHuidigeKleur = (frame) => {
                const kleurIndex = Math.floor(frame % aantalStappen);
                return kleuren[kleurIndex];
            }

            // Simuleer een loop waarin de kleurovergang wordt geanimeerd
            const animatieLoop = () => {
                let frame = 0

                const updateFrame = () => {
                    const huidigeKleur = getHuidigeKleur(frame)

                    // De GUI updaten
                    podium.value.plafondLampKleuren[index] = huidigeKleur

                    frame++
                    if (frame < aantalStappen) {
                        // De volgende stap 1/60 seconde later laten uitvoeren
                        animatieFrames.push(requestAnimationFrame(updateFrame))
                    }
                }

                updateFrame()
            }

            // Start de kleurovergangsanimatie
            animatieLoop();
        }
    })
}

/* ****************************************************** */
</script>

<template>
    <div id="wrapper">
        <Podium :podium="podium" class="shadow" />
        <Paneel
            :effectenLijst="effectenLijst"
            @effect-requested="checkEffect($event)"
            @effects-saved="saveBestand($event)"
            @reset-requested="resetPodium"
        />
    </div>
</template>

<style lang="scss">
#wrapper {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;

    height: 100vh;

    background: linear-gradient(
        to bottom right,
      #78ffed,
      #bc79fe
    );
}
</style>
