import Annotation, {
    AnnotationExternalWebResource,
    AnnotationMotivation,
    AnnotationTarget
} from "../annotations/Annotation";
import {ApolloClient, gql} from "@apollo/client";
import jwt_decode from "jwt-decode";

// For saying that a Rating is just a definition
export const ADDITIONAL_TYPE_RATING_DEFINITION = "https://vocab.trompamusic.eu/vocab#RatingDefinition"
// For making DefinedTerms that are a collection of tags
export const ADDITIONAL_TYPE_TAG_COLLECTION = "https://vocab.trompamusic.eu/vocab#TagCollection"
export const ADDITIONAL_TYPE_TAG_COLLECTION_ELEMENT = "https://vocab.trompamusic.eu/vocab#TagCollectionElement"
// For making DefinedTerms that are a collection of annotation motivations
export const ADDITIONAL_TYPE_MOTIVATION_COLLECTION = "https://vocab.trompamusic.eu/vocab#AnnotationMotivationCollection"
export const ADDITIONAL_TYPE_MOTIVATION_COLLECTION_ELEMENT = "https://vocab.trompamusic.eu/vocab#AnnotationMotivationCollectionElement"
// For saying that an ItemList is an annotation toolkit
export const ADDITIONAL_TYPE_ANNOTATION_TOOLKIT = "https://vocab.trompamusic.eu/vocab#AnnotationToolkit"
// For saying that an ItemList is an annotation session
export const ADDITIONAL_TYPE_ANNOTATION_SESSION = "https://vocab.trompamusic.eu/vocab#AnnotationSession"
export const OA_ANNOTATION_MOTIVATION_TYPE = "http://www.w3.org/ns/oa#Motivation"

export class TrompaError extends Error {

}

export default class TrompaClient {
    apolloClient: ApolloClient<any>;
    authProxyUrl: string;

    constructor(authProxyUrl: string, apolloClient: ApolloClient<any>) {
        this.authProxyUrl = authProxyUrl;
        this.apolloClient = apolloClient;
        this.getApiToken();
    }

    getApiToken = async () => {
        if (this.apiTokenExpired()) {
            return fetch(this.authProxyUrl).then(result => result.json()).then(token => {
                localStorage.setItem('CEAuthToken', token.token);
                console.debug("token true")
                return true;
            }).catch(() => {
                console.error("token false")
                return false;
            });
        }
        console.debug("not expired, true!")
        return true;
    }

    apiTokenExpired = (): boolean => {
        let apiToken = localStorage.getItem('CEAuthToken')
        if (apiToken) {
            let decoded = jwt_decode(apiToken);
            let now = Date.now() / 1000;
            // @ts-ignore
            if (decoded.exp - now < 100) {
                return true;
            } else {
                return false;
            }
        }
        return true;
    }

    saveAnnotation = async (annotation: Annotation) => {
        // TODO: Update if it already exists
        console.debug(annotation);
        const {motivation, creator, identifier} = annotation;
        await this.getApiToken();

        if (!motivation) {
            throw new TypeError("Annotation must have a motivation")
        }
        if (!annotation.target) {
            throw new TypeError("Annotation must have a target")
        }

        // Create body
        let bodyId: string | undefined;
        if (annotation.body) {
            for (const body of annotation.body) {
                if (body instanceof AnnotationExternalWebResource) {

                } else if (body.type === "TextualBody") {
                    let response = await this.apolloClient.mutate({
                        mutation: CreateAnnotationTextualBody,
                        variables: {creator: creator, value: body.value, language: body.language, format: body.format}
                    })
                    if (response.errors) {
                        console.error(response.errors)
                    } else {
                        bodyId = response.data.CreateAnnotationTextualBody.identifier;
                    }
                } else if (body.type === "DefinedTerm") {

                } else if (body.type === "NodeBody") {

                } else if (body.type === "Rating") {

                }
            }
        }

        // Create target
        let targetId: string | undefined;
        if (annotation.target) {
            for (const target of annotation.target) {
                if (target instanceof AnnotationTarget) {

                } else if (target.type === 'AnnotationTarget') {
                    let response = await this.apolloClient.mutate({
                        mutation: CreateAnnotationCETarget,
                        variables: {creator: creator, field: target.fieldName, fragment: target.fragment}
                    })
                    if (response.errors) {
                        console.error(response.errors)
                    } else {
                        targetId = response.data.CreateAnnotationCETarget.identifier;
                        response = await this.apolloClient.mutate({
                            mutation: MergeAnnotationCETargetTarget,
                            variables: {annotationCeTargetId: targetId, ceNodeId: target.nodeId}
                        })
                        if (response.errors) {
                            console.error(response.errors)
                        }
                    }
                }
            }
        }

        // Create annotation
        let response = await this.apolloClient.mutate({
            mutation: CreateAnnotation,
            variables: {creator: creator, motivation: motivation}
        })
        if (response.errors) {
            console.error(response.errors)
        } else {
            const annotationId = response.data.CreateAnnotation.identifier;
            if (bodyId) {
                response = await this.apolloClient.mutate({
                    mutation: MergeAnnotationBodyText,
                    variables: {annotationId: annotationId, bodyNodeId: bodyId}
                })
                if (response.errors) {
                    console.error(response.errors)
                }
            }
            if (targetId) {
                try {
                    response = await this.apolloClient.mutate({
                        mutation: MergeAnnotationTargetNode,
                        variables: {annotationId: annotationId, targetNodeId: targetId}
                    })
                } catch (e) {
                    console.error(e)
                }
            }
        }

        // Join annotation + motivation (if motivation is custom)
        // Join annotation + target
        // Join annotation + body
    }
    deleteAnnotation = async (identifier: string) => {
        await this.getApiToken();
        return await this.apolloClient.mutate({mutation: DeleteAnnotation, variables: {annotationId: identifier}})
    }

    getAnnotation = async (identifier: string) => {
        await this.getApiToken();
        return await this.apolloClient.query({query: GetAnnotation, variables: {annotationId: identifier}})
    }

    getAnnotationsForUser = async (user: string) => {
        await this.getApiToken();
        return await this.apolloClient.query({query: GetAnnotationsForCreator, variables: {creator: user}})
    }

    getAnnotationsForItem = (nodeId: string) => {
        this.getApiToken();
        this.apolloClient.query({query: GetAnnotationsForItem, variables: {nodeId: nodeId}})
    }

    getAnnotationToolkitForItem = (itemId: string) => {
        this.getApiToken();
        this.apolloClient.query({query: GetAnnotationToolkitForItem, variables: {itemId: itemId}})
    }

    deleteDefinedTerm = async (definedTermSetIdentifier: string, definedTermIdentifier: string) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            return await this.apolloClient.mutate({
                mutation: DeleteDefinedTerm,
                variables: {identifier: definedTermIdentifier}})
        }
    }

    deleteDefinedTermSet = async (identifier: string) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            return await this.apolloClient.mutate({
                mutation: DeleteDefinedTermSet,
                variables: {identifier}})
        }
    }

    createOrUpdateDefinedTerm = async (dtsIdentifier: string, definedTerm: TrompaAnnotationComponents.DefinedTerm) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            const response = await this.apolloClient.mutate({
                mutation: CreateDefinedTerm,
                variables: {
                    creator: definedTerm.creator,
                    termCode: definedTerm.termCode,
                    additionalType: definedTerm.additionalType
                }
            })
            await this.apolloClient.mutate({
                mutation: MergeDefinedTermSetHasDefinedTerm,
                variables: {
                    dtsId: dtsIdentifier,
                    dtId: response.data.CreateDefinedTerm.identifier
                }
            })
            return {data: response.data.CreateDefinedTerm}
        }
    }

    createOrUpdateDefinedTermSet = async (definedTermSet: TrompaAnnotationComponents.DefinedTermSet) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            return await this.apolloClient.mutate({
                mutation: CreateDefinedTermSet,
                variables: {
                    creator: definedTermSet.creator,
                    name: definedTermSet.name,
                    additionalType: definedTermSet.additionalType
                }
            })
        }
    }

    getDefinedTermSetsForUser = async (user: string, additionalType: string) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            return await this.apolloClient.query({
                query: QueryDefinedTermSetForUser,
                variables: {creator: user, additionalType: additionalType}})
        }
    }

    getAnnotationPaletteForUser = (user: string) => {
        return this.getDefinedTermSetsForUser(user, ADDITIONAL_TYPE_MOTIVATION_COLLECTION);
    }

    getAnnotationToolkitForUser = (user: string) => {
        return this.getDefinedTermSetsForUser(user, ADDITIONAL_TYPE_ANNOTATION_TOOLKIT);
    }

    static annotationFromCE(ceannotation: any, CE_URL: string): Annotation {
        // TODO: Optionally more than 1 target
        const {targetNode, targetUrl} = ceannotation;
        if (targetNode === undefined && targetUrl === undefined) {
            throw new TypeError("Annotation has no target")
        }
        let target: AnnotationTarget[] | TrompaAnnotationComponents.AnnotationCETarget[];
        if (targetUrl) {
            // If targetUrl is set, just create a generic AnnotationTarget object whose id
            // points to that url
            target = targetUrl?.map((url: string) => new AnnotationTarget({id: url}));
        } else {
            // Otherwise, create a specific Trompa AnnotationTarget with the data from the CE
            target = targetNode?.map((node: any) => {
                let start, end;
                if (node?.fragment) {
                    [start, end] = AnnotationTarget.fragmentToStartAndEnd(node.fragment)
                }
                let url: string = "";
                // TODO: The field of a CEAnnotationTarget could be anything, but in graphql we
                //  need to specify the exact fields that we want to return in a query
                //  For simplicity at the moment, just assume that it's one of
                //  (url, source) from ThingInterface, or contentUrl from MediaObjectInterface
                if (node.field === null) {
                    // Can be empty
                    url = `${CE_URL}${CE_URL.endsWith("/") ? "" : "/"}${node.target.identifier}`
                } else if (node.field === "url") {
                    url = node.target.url;
                } else if (node.field === "source") {
                    url = node.target.source;
                } else if (node.field === "contentUrl") {
                    url = node.target.contentUrl;
                } else {
                    throw new TypeError("Unsupported targetNode field value")
                }
                return {
                    identifier: node.identifier,
                    type: 'AnnotationTarget', nodeId: node.target.identifier,
                    fieldName: node.field, url: url,
                    start: start, end: end
                }
            });
        }
        let body: AnnotationExternalWebResource[] | TrompaAnnotationComponents.AnnotationBody[] = [];
        if (ceannotation.bodyUrl && ceannotation.bodyUrl.length > 0) {
            body = ceannotation.bodyUrl.map((url: string) => {return new AnnotationExternalWebResource({id: url})});
        } else if (ceannotation.bodyText && ceannotation.bodyText.length > 0) {
            body = ceannotation.bodyText.map((b: any) => {
                return {
                    value: b.value, format: b.format,
                    identifier: b.identifier, language: b.language,
                    type: 'TextualBody'
                }
            })
        } else if (ceannotation.bodyNode && ceannotation.bodyNode.length > 0) {
            body = ceannotation.bodyNode.map((b: any) => {
                if (b.__typename === 'DefinedTerm') {
                    return {
                        identifier: b.identifier, type: 'DefinedTerm',
                        creator: b.creator, additionalType: b.additionalType,
                        termCode: b.termCode
                    };
                } else if (b.__typename === 'Rating') {
                    return {
                        identifier: b.identifier, type: 'Rating',
                        creator: b.creator, bestRating: b.bestRating,
                        worstRating: b.worstRating, name: b.name,
                        additionalType: b.additionalType,
                        ratingValue: b.ratingValue
                    };
                } else {
                    return null;
                }
            })
        }

        // Motivation. We always have a motivation value ("base motivation"), and possibly a custom
        // one. Custom motivation can be an external URL, a DefinedTerm, or an AnnotationCEMotivation
        const motivation: AnnotationMotivation = this.parseMotivationValue(ceannotation.motivation)

        let customMotivation: TrompaAnnotationComponents.AnnotationCustomMotivation;
        if (ceannotation.motivationUrl && ceannotation.motivationUrl.length > 0) {
            // TODO: this might be an array??
            customMotivation = ceannotation.motivationUrl[0];
        } else if (ceannotation.motivationDefinedTerm) {
            // TODO: read DefinedTermSet broaderUrl/broaderMotivation
            const definedTerm = ceannotation.motivationDefinedTerm;
            customMotivation = {
                type: 'DefinedTerm', identifier: definedTerm.identifier,
                creator: definedTerm.creator, additionalType: definedTerm.additionalType,
                termCode: definedTerm.termCode
            }
        } else if (ceannotation.motivationNode && ceannotation.motivationNode.length > 0) {
            const ceMotivation = ceannotation.motivationNode[0]
            customMotivation = {
                type: 'AnnotationCEMotivation', identifier: ceMotivation.identifier,
                creator: ceMotivation.creator, description: ceMotivation.description,
                title: ceMotivation.title, broaderUrl: ceMotivation.broaderUrl,
                broaderMotivation: ceMotivation.broaderMotivation
            }
        }
        const newAnnotation = new Annotation({identifier: ceannotation.identifier,
            target: target, creator: ceannotation.creator, created: ceannotation.created?.formatted,
            motivation: motivation, customMotivation: customMotivation, body: body});
        newAnnotation.isNew = false;
        return newAnnotation;
    }


    /**
     * The values from the CE are enums, so don't contain the url prefix
     * @param motivationValue
     */
    static parseMotivationValue(motivationValue: string): AnnotationMotivation {
        switch (motivationValue) {
            // TODO: This doesn't contain all possible oa:Motivations.
            //  As the values from the CE are the same as the enum values we could do this better
            //  by just doing `AnnotationMotivation[value]`, but will still
            //  need to check what happens if it's an invalid/unexpected value
            case 'commenting':
                return AnnotationMotivation.COMMENTING;
            case 'describing':
                return AnnotationMotivation.DESCRIBING;
            case 'tagging':
                return AnnotationMotivation.TAGGING;
            case 'classifying':
                return AnnotationMotivation.CLASSIFYING;
            case 'assessing':
                return AnnotationMotivation.ASSESSING;
            case 'linking':
                return AnnotationMotivation.LINKING;
            default:
                throw new TypeError("Not known type")
        }
    }

    getThingById = async (id: string) => {
        await this.getApiToken();
        return await this.apolloClient.query({
            query: GetThingInterfaceById,
            variables: {id: id}})
    }

    getRatingDefinitionsForUser = async (user: string) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            return await this.apolloClient.query({
                query: GetRatingDefinitionsForUser,
                variables: {creator: user}})
        }
    }

    createRatingDefinition = async (ratingDefinition: TrompaAnnotationComponents.RatingDefinition) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            return await this.apolloClient.mutate({
                mutation: CreateRating,
                variables: {name: ratingDefinition.name, creator: ratingDefinition.creator,
                bestRating: ratingDefinition.bestRating, worstRating: ratingDefinition.worstRating,
                additionalType: ADDITIONAL_TYPE_RATING_DEFINITION, description: ratingDefinition.description}})
        }
    }

    deleteRating = async (ratingIdentifier: string) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            return await this.apolloClient.mutate({
                mutation: DeleteRating,
                variables: {identifier: ratingIdentifier}})
        }
    }

    createMotivation = async (motivation: TrompaAnnotationComponents.AnnotationCEMotivation) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            return await this.apolloClient.mutate({
                mutation: CreateAnnotationCEMotivation,
                variables: {
                    title: motivation.title,
                    creator: motivation.creator,
                    description: motivation.description,
                    broaderUrl: motivation.broaderUrl,
                    broaderMotivation: motivation.broaderMotivation
                }})
        }
    }

    deleteMotivation = async (identifier: string) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            return await this.apolloClient.mutate({
                mutation: DeleteAnnotationCEMotivation,
                variables: {identifier: identifier}})
        }
    }

    getMotivationsForUser = async (user: string) => {
        if (!await this.getApiToken()) {
            throw new TrompaError("whew")
        } else {
            return await this.apolloClient.query({
                query: GetAnnotationCEMotivationsForUser,
                variables: {creator: user}})
        }
    }
}

const GetThingInterfaceById = gql`
    query ThingInterface($id: ID!) {
        ThingInterface(identifier: $id) {
            __typename
            identifier
            source
            name
            title
            ... on MediaObjectInterface {
                contentUrl
            }
            ... on AudioObject {
                contentUrl
            }
        }
    }
`;

export const DefinedTermFragment = gql`
    fragment DefinedTermFragment on DefinedTerm {
        identifier
        additionalType
        termCode
        image
    }
`;

export const DefinedTermSetFragment = gql`
    ${DefinedTermFragment}
    fragment DefinedTermSetFragment on DefinedTermSet {
        type: __typename
        identifier
        name
        creator
        additionalType
        broaderUrl
        broaderMotivation
        hasDefinedTerm {
            ...DefinedTermFragment
        }
    }
`;

export const CreateDefinedTermSet = gql`
    ${DefinedTermSetFragment}
    mutation CreateDefinedTermSet($creator: String!, $name: String!, $additionalType: String!) {
        CreateDefinedTermSet(
            additionalType: [$additionalType]
            creator: $creator
            name: $name
        ) {
            ...DefinedTermSetFragment
        }
    }
`;

export const UpdateDefinedTermSet = gql`
    ${DefinedTermSetFragment}
    mutation UpdateDefinedTermSet($identifier: ID!, $creator: String!, $name: String!, $additionalType: String!) {
        UpdateDefinedTermSet(
            identifier: $identifier
            additionalType: [$additionalType]
            creator: $creator
            name: $name
        ) {
            ...DefinedTermSetFragment
        }
    }
`;

export const DeleteDefinedTermSet = gql`
    mutation DeleteDefinedTermSet($identifier: ID!) {
        DeleteDefinedTermSet(identifier: $identifier) {
            identifier
        }
    }
`;

export const CreateDefinedTerm = gql`
    mutation CreateDefinedTerm($creator: String!, $additionalType: String!, $termCode: String!, $image: String) {
        CreateDefinedTerm(
            additionalType: [$additionalType]
            creator: $creator
            termCode: $termCode
            image: $image
        ) {
            identifier
            additionalType
            creator
            termCode
            image
        }
    }
`;

export const UpdateDefinedTerm = gql`
    mutation UpdateDefinedTerm($identifier: ID!, $creator: String!, $additionalType: String!, $termCode: String, $image: String) {
        UpdateDefinedTerm(
            identifier: $identifier
            additionalType: [$additionalType]
            creator: $creator
            termCode: $termCode
            image: $image
        ) {
            identifier
        }
    }
`;

export const DeleteDefinedTerm = gql`
    mutation DeleteDefinedTerm($identifier: ID!) {
        DeleteDefinedTerm(identifier: $identifier) {
            identifier
        }
    }
`;

export const MergeDefinedTermSetHasDefinedTerm = gql`
    mutation MergeDefinedTermSetHasDefinedTerm($dtsId: ID!, $dtId: ID!) {
        MergeDefinedTermSetHasDefinedTerm(
            from: {identifier: $dtsId}
            to: {identifier: $dtId}
        ) {
            from {
                identifier
            }
            to {
                identifier
            }
        }
    }
`;

export const QueryDefinedTermSetForUser = gql`
    ${DefinedTermSetFragment}
    query DefinedTermSet($creator: String!, $additionalType: String!) {
        DefinedTermSet(creator: $creator filter: {additionalType_contains: [$additionalType]}) {
            ...DefinedTermSetFragment
        }
    }
`;

const CreateAnnotationTextualBody = gql`
    mutation CreateAnnotationTextualBody($creator: String!, $value: String!, $format: String, $language: AvailableLanguage){
        CreateAnnotationTextualBody(
            creator: $creator
            value: $value
            format: $format
            language: $language
        ) {
            identifier
        }
    }
`

const CreateAnnotationCETarget = gql`
    mutation CreateAnnotationCETarget($creator: String!, $field: String, $fragment: String) {
        CreateAnnotationCETarget(
            creator: $creator
            field: $field
            fragment: $fragment
        ) {
            identifier
        }
    }
`

const MergeAnnotationCETargetTarget = gql`
    mutation MergeAnnotationCETargetTarget($annotationCeTargetId: ID!, $ceNodeId: ID!) {
        MergeAnnotationCETargetTarget(
            from: {identifier: $annotationCeTargetId}
            to: {identifier: $ceNodeId}
        ) {
            from {identifier}
            to {identifier}
        }
    }
`

const CreateAnnotation = gql`
    mutation CreateAnnotation($creator: String!, $motivation: AnnotationMotivation!) {
        CreateAnnotation(
            creator: $creator
            motivation: $motivation
        ) {
            identifier
        }
    }
`

const DeleteAnnotation = gql`
    mutation DeleteAnnotation($annotationId: ID!) {
        DeleteAnnotation(identifier: $annotationId) {
            identifier
        }
    }
`;

const MergeAnnotationTargetNode = gql`
    mutation MergeAnnotationTargetNode($annotationId: ID!, $targetNodeId: ID!){
        MergeAnnotationTargetNode(
            from: {identifier: $annotationId}
            to: {identifier: $targetNodeId}
        ) {
            from {
                identifier
            }
            to {
                identifier
            }
        }
    }
`

const MergeAnnotationBodyText = gql`
    mutation MergeAnnotationBodyText($annotationId: ID!, $bodyNodeId: ID!){
        MergeAnnotationBodyText(
            from: {identifier: $annotationId}
            to: {identifier: $bodyNodeId}
        ) {
            from {
                identifier
            }
            to {
                identifier
            }
        }
    }
`

const annotation_common = `
	identifier
	creator
	created {
		formatted
	}
	targetUrl
	targetNode {
		target {
			__typename
			identifier
			url
			source
			... on MediaObject {
			    contentUrl
			}
			... on AudioObject {
			    contentUrl
			}
		}
		field
		fragment
	}
    motivation
    motivationUrl
    motivationNode {
      identifier
      creator
      broaderMotivation
      broaderUrl
      title
      description
    }
    motivationDefinedTerm {
      identifier
      broaderMotivation
      termCode
      broaderUrl
      additionalType
    }
	bodyUrl
	bodyText {
		identifier
		value
		format
		language
	}
	bodyNode {
		__typename
		identifier
		... on DefinedTerm {
			termCode
			additionalType
			inDefinedTermSet {
				... on DefinedTermSet {
					identifier
					additionalType
					name
				}
			}
		}
		... on Rating {
		    creator
			ratingValue
			bestRating
			worstRating
			additionalType
		}
	}
`

const GetAnnotationsForCreator = gql`
    query AnnotationForCreator($creator: String!) {
        Annotation(creator: $creator) {
            ${annotation_common}
        }
    }
`

const GetAnnotationsForItem = gql`
    query AnnotationForNode($nodeId: String!) {
        Annotation(filter:{targetNode:{target:{identifier:$nodeId}}}) {
            ${annotation_common}
        }
    }
`

const GetAnnotation = gql`
    query Annotation($annotationId: ID!) {
        Annotation(identifier: $annotationId) {
            ${annotation_common}
        }
    }
`

const GetAnnotationToolkitForItem = gql`
    query AnnotationToolkitForItem($itemId: ID!) {
        ItemList(identifier:$itemId) {
            additionalType
            identifier
            name
            itemListElement {
                ... on ListItem {
                    identifier
                    name
                    itemUrl
                    item {
                        __typename
                        identifier
                        ... on DefinedTermSet {
                            name
                            additionalType
                            hasDefinedTerm {
                                identifier
                                broaderUrl
                                broaderMotivation
                                termCode
                                image
                            }
                        }
                        ... on Rating {
                            name
                            worstRating
                            bestRating
                        }
                    }
                }
            }
        }
    }
`;

const GetRatingDefinitionsForUser = gql`
    query RatingDefinitionsForUser($creator: String!) {
        Rating(creator: $creator, filter: {additionalType_contains: ["${ADDITIONAL_TYPE_RATING_DEFINITION}"]}) {
            identifier
            creator
            additionalType
            name
            description
            bestRating
            worstRating
        }
    }
`;

const DeleteRating = gql`
    mutation DeleteRating($identifier: ID!) {
        DeleteRating(identifier: $identifier) {
            identifier
        }
    }
`;

const CreateRating = gql`
    mutation CreateRating($name: String!, $creator: String!, $bestRating: Int!, $worstRating: Int!, 
        $ratingValue: Int, $additionalType: String!, $description: String
    ) {
        CreateRating(
            creator: $creator
            name: $name
            bestRating: $bestRating
            worstRating: $worstRating
            additionalType: [$additionalType]
            description: $description
            ratingValue: $ratingValue
        ) {
            identifier
            creator
            name
            description
            bestRating
            worstRating
            ratingValue
            additionalType
        }
    }
`;


const GetAnnotationCEMotivationsForUser = gql`
    query AnnotationCEMotivationForUser($creator: String!) {
        AnnotationCEMotivation(creator: $creator) {
            identifier
            creator
            created {formatted}
            title
            description
            broaderUrl
            broaderMotivation
        }
    }
`;

const DeleteAnnotationCEMotivation = gql`
    mutation AnnotationCEMotivation($identifier: ID!) {
        DeleteAnnotationCEMotivation(identifier: $identifier) {
            identifier
        }
    }
`;

const CreateAnnotationCEMotivation = gql`
    mutation CreateAnnotationCEMotivation($title: String!, $creator: String!, $description: String,
        $broaderUrl: String, $broaderMotivation: AnnotationMotivation
    ) {
        CreateAnnotationCEMotivation(
            creator: $creator
            title: $title
            description: $description
            broaderUrl: $broaderUrl
            broaderMotivation: $broaderMotivation
        ) {
            identifier
            creator
            created {formatted}
            title
            description
            broaderUrl
            broaderMotivation
        }
    }
`;
