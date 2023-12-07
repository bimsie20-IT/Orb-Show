<script setup>
import { onMounted, ref } from 'vue'
import _ from 'lodash'
import chroma from 'chroma-js'
import Podium from './components/Podium.vue'
import Paneel from './components/Paneel.vue'
const XMLparser = new DOMParser
const XMLserializer = new XMLSerializer()

const props = defineProps(['inhoud', 'refreshRate'])

/* Luisteren voor events van het menu */

electronAPI.onSoundtrackAdded(async (naamBestand) => {
    // Het XML element "mainAudio" aanmaken
    const mainAudioXML = inhoud.createElement('mainAudio')

    // De naam van het bestand meegeven in de "filename" attribute
    mainAudioXML.setAttribute('filename', naamBestand)

    // Het element toevoegen als een child element aan het "extraFiles" element
    inhoud.getElementsByTagName('extraFiles')[0].append(mainAudioXML)

    // Het XML object serializeren naar een string
    const inhoudString = XMLserializer.serializeToString(inhoud)

    // Het bestand opslaan
    await electronAPI.saveBestand(inhoudString)

    // Het audiobestand inladen
    laadExtraBestanden()
})

/* ********************************** */

// De inhoud van het bestand parsen naar XML
const inhoud = XMLparser.parseFromString(props.inhoud, 'text/xml')

// De XML elementen inlezen en definieren
const orbShow = inhoud.getElementsByTagName('orbShow')[0]
const stage = orbShow.getElementsByTagName('stage')[0]
const extraBestanden = orbShow.getElementsByTagName('extraFiles')[0].childNodes
const effectenLijst = stage.getElementsByTagName('effects')[0].childNodes

/* De extra bestanden inladen */

const laadExtraBestanden = () => {
    extraBestanden.forEach(async (bestand) => {
        const typeBestand = bestand.nodeName
        const naamBestand = bestand.attributes.filename.nodeValue

        // De inhoud van het bestand opvragen
        const data = await electronAPI.openExtraBestand(naamBestand)

        // Voor elk type extra bestand geldt een andere uitvoering
        switch (typeBestand) {
            case 'mainAudio':
                // De inhoud van het bestand omcoderen naar audio voor de browser
                const audio = new Blob([data[1]], { type: 'audio/wav' })
                const url = URL.createObjectURL(audio)

                // De bron van de audiospeler instellen
                audioPlayer.src = url
                break
        }
    })
}

const audioPlayer = new Audio()

onMounted(() => {
    laadExtraBestanden()
})

/* ************************** */

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
    await electronAPI.saveBestand(inhoudString)
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
            @start-audio="audioPlayer.play()"
            @pauzeer-audio="audioPlayer.pause()"
            @stop-audio="() => {
                audioPlayer.pause()
                audioPlayer.currentTime = 0
            }"
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
