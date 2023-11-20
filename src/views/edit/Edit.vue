<script setup>
import { ref } from 'vue'
import _ from 'lodash'
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

// De initiele objecten van het podium definieren
const podiumStart = {
    plafondLampKleuren: Array.from({ length: 6 }, () => '#ffffff'),
    achterdoekKleuren: Array.from({ length: 60 }, () => '#000000')
}

const podium = ref(_.cloneDeep(podiumStart))

const resetPodium = () => {
    animatieFrames.forEach(frame => {
        cancelAnimationFrame(frame)
    })
    animatieFrames = []
    podium.value = _.cloneDeep(podiumStart)
}

/* ******************************** */

/* Functies voor het uitvoeren van effecten op het podium */

// Deze functie controleert welk effect er moet uitgevoerd worden
const checkEffect = (effect) => {
    switch (effect.effectType) {
        case 'spot_shift':
            colorShiftEffect(effect.params.color, effect.params.duration, effect.params.spots, podium.value.plafondLampKleuren)
            break
        case 'cloth_shift':
            colorShiftEffect(effect.params.color, effect.params.duration, effect.params.panelen, podium.value.achterdoekKleuren)
            break
        case 'cloth_full_shift':
            clothFullShiftEffect(effect.params.color, effect.params.backColor, effect.params.duration, effect.params.panelen, podium.value.achterdoekKleuren)
            break
    }
}

/*
We bewaren de ingestelde animaties op,
zodat we ze later kunnen annuleren als de gebruiker op stop drukt
*/
let animatieFrames = []

// Deze functie fade naar een bepaalde kleur vanaf een gegeven startkleur
const colorShiftEffect = (eindKleur, duur, spotsOfPanelen, podiumKleuren) => {
    spotsOfPanelen.forEach((spotOfPaneel, index) => {
        if (spotOfPaneel) {
            const startKleur = podiumKleuren[index]

            // Voor elke seconden zijn 60 frames nodig voor vloeiende bewegingen
            const aantalStappen = duur * props.refreshRate

            const kleuren = chroma.scale([startKleur, eindKleur]).colors(aantalStappen);

            // Simuleer een loop waarin de kleurovergang wordt geanimeerd
            const animatieLoop = () => {
                let frame = 0

                const updateFrame = () => {
                    // De huidige kleur ophalen op basis van de frame-index
                    const kleurIndex = Math.floor(frame % aantalStappen);
                    const huidigeKleur = kleuren[kleurIndex]

                    // De GUI updaten
                    podiumKleuren[index] = huidigeKleur

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

// Deze functie fade naar een bepaalde kleur vanaf een gegeven startkleur, en backkleur
const clothFullShiftEffect = (eindKleur, eindBackKleur, duur, panelen, podiumKleuren) => {
    panelen.forEach((paneel, index) => {
        const startKleur = podiumKleuren[index]

        // Voor elke seconden zijn 60 frames nodig voor vloeiende bewegingen
        const aantalStappen = duur * props.refreshRate

        const kleuren = chroma.scale([startKleur, paneel ? eindKleur : eindBackKleur]).colors(aantalStappen);

        // Simuleer een loop waarin de kleurovergang wordt geanimeerd
        const animatieLoop = () => {
            let frame = 0

            const updateFrame = () => {
                // De huidige kleur ophalen op basis van de frame-index
                const kleurIndex = Math.floor(frame % aantalStappen);
                const huidigeKleur = kleuren[kleurIndex]

                // De GUI updaten
                podiumKleuren[index] = huidigeKleur

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
    })
}

/* ****************************************************** */
</script>

<template>
    <div id="wrapper">
        <Podium :podium="podium" class="shadow" />
        <Paneel
            :podium="podium"
            :effectenLijst="effectenLijst"
            @effect-requested="checkEffect"
            @effects-saved="saveBestand"
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
