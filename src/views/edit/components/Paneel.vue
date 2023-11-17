<script setup>
import { onMounted, ref } from 'vue'
import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg'

/*
We moeten uiteindelijk met het hoofdcomponent van de view communiceren,
zodat we de effecten voor het podium kunnen laten uitvoeren
En we moeten ook kunnen opslaan voordat we afsluiten
*/
const emit = defineEmits(['effect-requested', 'effects-saved', 'reset-requested'])

// Het deel van het XML bestand dat de lijst met effecten bevat
const props = defineProps(['effectenLijst', 'podium'])

// De tijdlijn waarvoor elke seconde effecten kan bevatten
const effectDrops = ref([])

// De spatie tussen de drops kan geregeld worden met een slider
const dropSpatie = ref(10) // ...px

// De effectdrops creeren en de al bestaande effecten eraan toevoegen
onMounted(() => {
    const aantalEffecten = Object.keys(props.effectenLijst).length

    // Het aantal miliseconden ter beschikking om effecten uit te voeren
    const aantalSeconden = 3000

    // Key's worden gebruikt voor prestaties met data binding in lijsten
    let key = 0
    // De effectdrops aanmaken
    while (key<aantalSeconden) {

        effectDrops.value.push({
            effecten: [],
            dropId: key // De key komt overneen met de drop-id
        })

        // Zoeken naar effecten op dit tijdstip
        for (let j=0; j<aantalEffecten; j++) {
            if (props.effectenLijst[j].attributes.dropid.nodeValue == key) {
                const effectType = props.effectenLijst[j].getElementsByTagName('type')[0].childNodes[0].nodeValue
                const parameters = props.effectenLijst[j].getElementsByTagName('params')[0]

                // De parameters voor de functie van het effect te kunnen uitvoeren
                let effectParameters = {}

                // Voor elke effect zijn andere parameters nodig
                switch (effectType) {
                    case 'color_shift':
                        effectParameters = {
                            duration: parameters.getElementsByTagName('duration')[0].childNodes[0].nodeValue,
                            color: parameters.getElementsByTagName('color')[0].childNodes[0].nodeValue,
                            spots: parameters.getElementsByTagName('spots')[0].childNodes[0].nodeValue.split(',')
                        }
                        break
                    case 'cloth_shift':
                        effectParameters = {
                            duration: parameters.getElementsByTagName('duration')[0].childNodes[0].nodeValue,
                            color: parameters.getElementsByTagName('color')[0].childNodes[0].nodeValue,
                            panelen: parameters.getElementsByTagName('panelen')[0].childNodes[0].nodeValue.split(',')
                        }
                        break
                }
                effectDrops.value[key].effecten.push({
                    effectType: effectType,
                    params: effectParameters
                })
            }
        }

        key++
    }
    console.log('+++')
    console.log(effectDrops.value)
})

/* effectendoos */

// De effecten in de effectendoos met hun eigenschappen + design
const effectenDoos = [
    {
        type: 'flash',
        icon: 'lightbulb-fill'
    },
    {
        type: 'color_shift',
        icon: 'palette-fill'
    },
    {
        type: 'cloth_shift',
        icon: 'border'
    }
]

// We hebben extra informatie nodig om het forum te doen werken
const effectForumDetails = ref({
    dropId: 0,
    effectType: ''
})

// Om te weten of alle wijzigingen zijn opgeslagen, moeten we dat onthouden
const wijzigingenOpgeslagen = ref(true)

// De gebruiker sleept een effect
const dragEffect = (ev) => {
    // De data instellen op het gekozen type van effect
    ev.dataTransfer.setData('effect', ev.target.attributes.effectType.nodeValue)
}
// De gebruiker dropt een effect op een effectdrop
const dropEffect = (ev) => {
    // Het meegegeven type van effect van het effect uitlezen
    const effectType = ev.dataTransfer.getData('effect')

    // Deze drop verliest zijn markering
    ev.target.style.boxShadow = '-1px -1px 1px black'

    /* forum */

    // het forum-modal om het effect in te stellen
    const effectForum = document.getElementById('effect_form')

    // Extra informatie meegeven aan het effectforum
    effectForumDetails.value.effectType = effectType
    effectForumDetails.value.dropId = ev.target.attributes.dropid.nodeValue

    // Het effectforum openen
    effectForum.showModal()

    /* ***** */
}
// De gebruiker hovert over een van de effectdrops
const animateDragOver = (ev) => {
    // Deze drop krijgt een markering
    ev.target.style.boxShadow = '-3px 0px 4px blue inset'
}
// De gebruiker verlaat een van de effectdrops
const animateDragLeave = (ev) => {
    // Deze drop verliest zijn markering
    ev.target.style.boxShadow = '-1px -1px 1px black'
}
// De gebruiker heeft een gegeven effect ingesteld
const submitEffect = () => {
    const effectForum = document.getElementById('effect_form')

    // het effectforum sluiten
    effectForum.close()

    // De ingegeven data van het forum ophalen
    const forumData = new FormData(effectForum.getElementsByTagName('form')[0])

    // De parameters voor de functie van het effect te kunnen uitvoeren
    let effectParameters = {}

    // Voor elke effect zijn andere parameters nodig
    switch (effectForumDetails.value.effectType) {
        case 'color_shift':
            effectParameters = {
                duration: forumData.get('duration'),
                color: forumData.get('color'),
                spots: []
            }
            Object.keys(props.podium.plafondLampKleuren).forEach(key => {
                effectParameters.spots.push(forumData.get('spot-' + key))
            })
            break
        case 'cloth_shift':
            effectParameters = {
                duration: forumData.get('duration'),
                color: forumData.get('color'),
                panelen: []
            }
            Object.keys(props.podium.achterdoekKleuren).forEach(key => {
                effectParameters.panelen.push(forumData.get('achterdoek_paneel-' + key))
            })
            break
    }

    effectDrops.value[effectForumDetails.value.dropId].effecten.push({
        effectType: effectForumDetails.value.effectType,
        params: effectParameters
    })
    console.log('+++')
    console.log(effectDrops.value)

    // Er zijn wijzigingen geweest
    wijzigingenOpgeslagen.value = false
}

// De functie die de wijzigingen in het gemaakte bestand kan opslaan
const saveEffecten = () => {
    // De wijzigingen zijn opgeslagen
    wijzigingenOpgeslagen.value = true

    // Een array om de effecten apart op te slaan van de effectdrops
    let effecten = []

    // Alle effecten in een XML formaat plaatsen
    effectDrops.value.forEach((effectDrop, index) => {
        effectDrop.effecten.forEach(effect => {
            effecten.push({ dropId: index, effect: effect })
        })
    })

    // De effecten array emitten naar Edit.vue
    emit('effects-saved', effecten)
}

/* ************ */

/* effectenloop */

// De gebruiker kan deze variabel doen omkeren met de play knop
const running = ref(false)

// De zoveelste seconde op de tijdlijn
let seconde = ref(0)

// Een interval om de main loop aan te sturen
let runInterval

// De (time-out) loop om alle effectDrops af te gaan
const run = () => {
        // Voor elk effect geregistreerd op deze seconde
        effectDrops.value[seconde.value].effecten.forEach(effect => {
            // Emit een verzoek om het effect uit te voeren
            emit('effect-requested', effect)
            console.log(effect.params)
        })

        seconde.value++
}

// Een functie om de loop te doen (her)starten of stoppen
const toggle = () => {
    // De status omdraaien
    running.value = !running.value

    // Het interval starten op basis van de status
    running.value ? runInterval = setInterval(run, 100) : clearInterval(runInterval)
}

// Een functie om de huidige seconde op 0 te zetten
const reset = () => {
    running.value = false

    // De main loop stoppen
    clearInterval(runInterval)

    // Terug naar start gaan
    seconde.value = 0

    // Het podium resetten zoals het was op het begin
    emit('reset-requested')
}

/* ************ */
</script>

<template>
    <div id="paneel">

        <div id="controle_paneel">
            <button
                @click="toggle()"
                id="toggle"
                type="button"
            >
                <svg class="bi" width="5vh" height="5vh" fill="currentColor">
                    <use v-if="running" :href="bootstrapIcons + '#' + 'pause-circle'" />
                    <use v-else :href="bootstrapIcons + '#' + 'play-circle'" />
                </svg>
            </button>
            <button
                @click="reset()"
                id="reset"
                type="button"
                :style="{ backgroundColor: seconde > 0 ? 'red' : 'grey' }"
            >
                <svg class="bi" width="5vh" height="5vh" fill="currentColor">
                    <use :href="bootstrapIcons + '#' + 'stop-circle'" />
                </svg>
            </button>
            <button
                @click="saveEffecten"
                id="save"
                type="button"
                :style="{ backgroundColor: wijzigingenOpgeslagen ? 'grey' : 'lightcoral'}"
            >
                <svg class="bi" width="5vh" height="5vh" fill="currentColor">
                    <use :href="bootstrapIcons + '#' + 'floppy-fill'" />
                </svg>
            </button>
            <input
                v-model="dropSpatie"
                type="range"
                id="drop_slider"
                min="2"
                max="20"
            />
        </div>

        <div class="rounded shadow" id="effect_paneel">
            <!-- Alle seconden op het paneel renderen met de toegewezen effecten erbij -->
            <div v-for="effectDrop in effectDrops"
                class="effect_drop"
                :key="effectDrop.dropId"
                :style="{ width: dropSpatie + 'px' }"
            >
                <div
                    class="effect_drop_timestamp"
                    :dropId="effectDrop.dropId"
                    :style="{
                        backgroundColor: seconde == effectDrop.dropId + 1 && effectDrop.effecten.length ? 'orange'
                            : seconde == effectDrop.dropId + 1 ? 'green'
                            : effectDrop.effecten.length ? 'red'
                            : 'rgba(0, 0, 0, 0)'
                    }"
                    @drop="dropEffect"
                    @dragover="animateDragOver"
                    @dragleave="animateDragLeave"
                    @dragover.prevent
                    @dragenter.prevent
                ></div>
            </div>
        </div>

        <div class="rounded shadow" id="effect_doos">
            <!-- Alle effecten in de effectendoos renderen met de toegewezen eigenschappen + icons erbij -->
            <div v-for="effect in effectenDoos"
                class="effect btn btn-primary"
                :effectType="effect.type"
                :title="effect.type"
                draggable="true"
                @dragstart="dragEffect"
            >
                <svg class="bi" width="5vh" height="5vh" fill="currentColor">
                    <use :xlink:href="bootstrapIcons + '#' + effect.icon" />
                </svg>
            </div>
        </div>

        <!-- Het forum dat tevoorschijn komt, waarneer je een effect wil instellen -->
        <dialog class="rounded shadow" id="effect_form">
            <form @submit.prevent class="d-flex flex-column">
                <div class="mb-2">
                    <label v-if="effectForumDetails.effectType == 'color_shift'" class="form-label">Spots:</label>
                    <div v-if="effectForumDetails.effectType == 'color_shift'" class="lamp_checker d-flex justify-content-between">
                        <div
                            v-for="(x, index) in props.podium.plafondLampKleuren"
                            class="form-check"
                        >
                            <input type="checkbox" class="form-check-input" :name="'spot-' + index" />
                            <label class="form-check-label">{{ index + 1 }}</label>
                        </div>
                    </div>
                </div>

                <div
                    v-if="effectForumDetails.effectType == 'cloth_shift'"
                    class="mb-4"
                >
                    <label class="form-label">Lights:</label>
                    <div id="achterdoek_checker">
                        <div
                            v-for="(x, index) in props.podium.achterdoekKleuren"
                            class="achterdoek_checker_checkbox"
                        >
                            <input type="checkbox" :name="'achterdoek_paneel-' + index" />
                        </div>
                    </div>
                </div>

                <div class="mb-2">
                    <label class="form-label">Duration:</label>
                    <input type="number" name="duration" value="1" min="1" max="10" class="form-control form-control-sm" />
                </div>

                <div
                    v-if="effectForumDetails.effectType == 'color_shift' || effectForumDetails.effectType == 'cloth_shift'"
                    class="mb-2"
                >
                    <label class="form-label">Color:</label>
                    <input type="color" name="color" class="form-control form-control-color" />
                </div>

                <button @click="submitEffect" type="submit" class="btn btn-primary">Submit</button>
            </form>
        </dialog>

    </div>
</template>

<style lang="scss">
#paneel {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;

    width: 100%;

    #controle_paneel {
        #toggle {
            background-color: greenyellow;
        }
        #drop_slider {
            height: 3vh;

            appearance: none;

            border-radius: 20px;
            background: linear-gradient(
                to bottom right,
              #79698a,
              #628580
            );
            outline: none;
        }

        #drop_slider::-webkit-slider-thumb {
            height: 4vh;
            width: 4vh;

            appearance: none;

            border-radius: 20px;
            background-color: #ff8cff;

            cursor: pointer;

            transition: background-color .5s;
        }

        #drop_slider::-webkit-slider-thumb:hover {
            background-color: #b922ff;
        }
    }

    #effect_paneel {
        display: flex;

        height: 12vh;
        width: 75%;

        overflow-x: scroll;

        background: linear-gradient(
            to bottom,
            #ffffce,
            #cccc89
        );

        .effect_drop {
            flex-shrink: 0;

            width: 10px;

            .effect_drop_timestamp {
                height: 50%;

                border-right: 1px solid black;
                box-shadow: -1px -1px 1px black;
            }
        }
    }

    #effect_doos {
        display: flex;

        height: 12vh;
        width: 70%;

        border: 1px outset #89aeff;
        background: linear-gradient(
            to bottom,
            #89aeff,
            #638be0
        );

        .effect {
            flex-grow: 1;

            display: flex;
            justify-content: center;
            align-items: center;

            margin: 1.5vh;

            border: 2px inset #89aeff;
            border-radius: 20px;
            box-shadow: 0px 0px 15px inset rgb(87, 87, 87);
            background-color: #1b949c;
        }
        .effect:hover {
            background-color: #7ed2eb;

            cursor: grab;
        }
    }

    #effect_form {
        height: 45vh;
        width: 60vh;

        border: 2px solid black;
        background: linear-gradient(
            to bottom right,
            #28b8c2,
            #116c72
        );

        form {
            display: flex;
            align-items: center;

            #achterdoek_checker {
                display: grid;
                grid-template-rows: repeat(6, 1fr);
                grid-template-columns: repeat(10, 1fr);
                height: 25vh;
                width: 40vh;

                .achterdoek_checker_checkbox {
                    border: 1px dotted white;

                    input {
                        appearance: none;

                        height: 100%;
                        width: 100%;

                        background-color: black;

                        cursor: pointer;
                    }

                    input:checked {
                        background-color: yellow;
                    }
                }
            }

            input[type="number"], input[type="color"], button[type="submit"] {
                width: 50vh;
            }
        }
    }
}

/* Scroller design */
::-webkit-scrollbar {
    height: 1.5vh;
    width: 1px;
}
::-webkit-scrollbar-track {
    box-shadow: inset 0 0 5px grey;
}
::-webkit-scrollbar-thumb {
    border-radius: 20px;
}
::-webkit-scrollbar {
    background-color: whitesmoke;
}
::-webkit-scrollbar-thumb {
    background-color: #7e7e7e;
}
::-webkit-scrollbar-thumb:hover {
    background-color: #969595;
}
</style>
