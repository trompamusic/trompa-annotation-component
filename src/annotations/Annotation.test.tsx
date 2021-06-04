import Annotation from "./Annotation";


export {}

describe("Annotation", () => {
    it("target is url", () => {
        const target_url = require('./testdata/target-url.json')
        let ann = Annotation.fromCE(target_url, "http://localhost:4000/")
        expect(ann.target).toEqual("https://example.com/audio.mp3")
    })
    it("target is node without field", () => {
        const target_node = require('./testdata/target-node-only.json')
        let ann = Annotation.fromCE(target_node, "http://localhost:4000/")
        const expected = {
            "end": undefined,
            "fieldName": null,
            "identifier": "bc1e6b56-39e3-463e-ab92-a9f9d1551e89",
            "nodeId": "b8932d65-cb97-409f-b0cd-fecb0643c599",
            "start": undefined,
            "type": "AnnotationTarget",
            "url": "http://localhost:4000/b8932d65-cb97-409f-b0cd-fecb0643c599",
        }
        expect(ann.target).toEqual(expected)
    })
    it("target is node with source field (ThingInterface)", () => {
        const target_node_source = require('./testdata/target-node-source.json')

        let ann = Annotation.fromCE(target_node_source, "http://localhost:4000/")
        let expected = {
            "end": undefined,
            "fieldName": "source",
            "identifier": "4b83defa-2cfc-4fbc-801c-392c66ef5aec",
            "nodeId": "e05d3a8b-903b-47b5-abf0-405811b1e18f",
            "start": undefined,
            "type": "AnnotationTarget",
            "url": "https://trompa-mtg.upf.edu/data/anno-component-test/source_SMC_015.wav",
        }
        expect(ann.target).toEqual(expected)
    })
    it("target is node with contentUrl field (MediaObject)", () => {
        const target_contenturl_fragment = require('./testdata/target-contenturl-fragment.json')

        let ann = Annotation.fromCE(target_contenturl_fragment, "http://localhost:4000/")
        let expected = {
            "end": 20,
            "fieldName": "contentUrl",
            "identifier": "4b83defa-2cfc-4fbc-801c-392c66ef5aec",
            "nodeId": "e05d3a8b-903b-47b5-abf0-405811b1e18f",
            "start": 10,
            "type": "AnnotationTarget",
            "url": "https://trompa-mtg.upf.edu/data/anno-component-test/contenturl_SMC_015.wav",
        }
        expect(ann.target).toEqual(expected)
    })
    it("target is node with fragment", () => {
        // tested in the above test
    })
    it("has motivation", () => {
        const motivation = require('./testdata/motivation-url.json')
        let ann = Annotation.fromCE(motivation, "http://localhost:4000/")
        expect(ann.motivation).toEqual("commenting")
    })
    it("has motivation url", () => {
        // this is from the demos.annotation.annotationmotivationurl demo in the python library
        const motivation = require('./testdata/motivation-url.json')
        let ann = Annotation.fromCE(motivation, "http://localhost:4000/")
        expect(ann.customMotivation).toEqual("https://example.com/schema/motivations#praise")
    })
    it("has custom motivation", () => {
        // this is from the demos.annotation.annotationlinking demo in the python library
        const motivation = require('./testdata/motivation-custom.json')
        let ann = Annotation.fromCE(motivation, "http://localhost:4000/")
        let expected = {
            type: 'AnnotationCEMotivation',
            identifier: "b2eeec78-69dc-4aa9-aaeb-a74703cc081c",
            creator: "https://testuser.trompa-solid.upf.edu/profile/card#me",
            description: "This motivation groups together 4 different annotations into a single meta-annotationwhich represents the full description of a recording by a user",
            title: "Music scholars feedback grouping",
            broaderUrl: null,
            broaderMotivation: "linking"
        }
        expect(ann.customMotivation).toEqual(expected)

    })
    it("has DefinedTerm motivation", () => {
        // this is from the demos.annotation.annotationmotivation demo in the python library
        const motivation = require('./testdata/motivation-definedterm.json')
        let ann = Annotation.fromCE(motivation, "http://localhost:4000/")
        let expected = {
            type: 'DefinedTerm',
            identifier: "69aa0934-6335-4b0b-a659-a26ed0058e28",
            creator: "https://testuser.trompa-solid.upf.edu/profile/card#me",
            termCode: "Arco",
            broaderUrl: null,
            broaderMotivation: "commenting",
            additionalType: [
                "https://vocab.trompamusic.eu/vocab#AnnotationMotivationCollectionElement",
                "http://www.w3.org/ns/oa#Motivation"
            ]
        }
        expect(ann.customMotivation).toEqual(expected)
    })
    it("has url body", () => {
        const body = require('./testdata/body-url.json')
        let ann = Annotation.fromCE(body, "http://localhost:4000/")
        let expected = [
            "https://trompamusic.eu/something",
            "http://example.com/somethingelse"
        ]
        expect(ann.body).toEqual(expected)
    })
    it("has textual body", () => {
        const body = require('./testdata/body-text.json')
        let ann = Annotation.fromCE(body, "http://localhost:4000/")
        let expected = {
            type: 'TextualBody',
            identifier: "fc7870e5-6ff4-4f22-8891-ecd7f822562e",
            value: "if the <i>format</i> field is set correctly, the value of the <b>textualbody</b> can even be html!",
            language: "en",
            format: "text/html"
        }
        expect(ann.body).toEqual(expected)
    })
    it("has some other node body", () => {
        // TODO: Is this needed
    })
    it("has DefinedTerm body", () => {
        const body = require('./testdata/body-definedterm.json')
        let ann = Annotation.fromCE(body, "http://localhost:4000/")
        let expected = {
            type: "DefinedTerm",
            identifier: "7900bda7-2db9-4b0b-95ff-091fc345bf03",
            creator: undefined,
            additionalType: ["https://vocab.trompamusic.eu/vocab#TagCollectionElement"],
            termCode: "Happy"
        }
        expect(ann.body).toEqual(expected)
    })
    it("has Rating body", () => {
        const body = require('./testdata/body-rating.json')
        let ann = Annotation.fromCE(body, "http://localhost:4000/")
        let expected = {
            identifier: "4f18b566-631a-4d7b-98c1-efd37a0b60b7",
            type: 'Rating',
            creator: "https://testuser.trompa-solid.upf.edu/profile/card#me",
            bestRating: 10,
            worstRating: 1,
            additionalType: null,
            ratingValue: 8
        }
        expect(ann.body).toEqual(expected)
    })
})
