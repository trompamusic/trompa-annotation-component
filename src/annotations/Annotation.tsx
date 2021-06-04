export enum DefaultAnnotationMotivation {
    COMMENTING = "commenting", // freeform long text
    DESCRIBING = "describing", // freeform long text
    TAGGING = "tagging", // freeform short text
    CLASSIFYING = "classifying", // closed vocabulary
    ASSESSING = "assessing", // ratings
    LINKING = "linking"
}

export enum TimeFragmentType {
    RANGE = '1',
    PUNCTUAL = '2',
    WHOLE = '3',
}

export default class Annotation {
    identifier: string;
    motivation?: DefaultAnnotationMotivation;
    customMotivation?: TrompaAnnotationComponents.AnnotationCustomMotivation;

    creator?: string;
    created?: string;
    // TODO: Could also be an array of any of these types, but for now we assume it's just one
    body?: TrompaAnnotationComponents.AnnotationBody;
    target: TrompaAnnotationComponents.AnnotationTarget;
    isNew: boolean = true;

    constructor(identifier: string, target: TrompaAnnotationComponents.AnnotationTarget, creator?: string, created?: string,
                motivation?: DefaultAnnotationMotivation, customMotivation?: TrompaAnnotationComponents.AnnotationCustomMotivation,
                body?: TrompaAnnotationComponents.AnnotationBody) {
        this.identifier = identifier;
        this.target = target;
        this.creator = creator;
        this.created = created;
        this.motivation = motivation;
        this.customMotivation = customMotivation;
        /**
         if (targetId) {
			// If this annotation has a start and/or end, technically the target will also have a
			// fragment set. However for simplicity we don't set it here, and just get it on
			// demand with .timeString. We could have a smart setter for .start and .end that
			// automatically filled this in, but it's not important now.
			this.target = {type: 'AnnotationTarget', nodeId: targetId, fieldName: targetField}
		}
         */
        this.body = body;
    }

    get start(): number | undefined {
        if (typeof this.target !== "string") {
            return this.target.start;
        }
        return undefined;
    }

    get end(): number | undefined {
        if (typeof this.target !== "string") {
            return this.target.end;
        }
        return undefined;
    }

    set start(start: number | undefined) {
        if (typeof this.target !== "string") {
            this.target.start = start === undefined ? start : Math.max(start, 0);
        }
    }

    set end(end: number | undefined) {
        if (typeof this.target !== "string") {
            if (this.target.start !== undefined && end !== undefined) {
                this.target.end = Math.max(this.target.start, end);
            } else {
                this.target.end = end;
            }
        }
    }


    get timeString(): string | null {
        if (typeof this.target === "string") {
            // TODO: This could parse the string of target and get a fragment if set
            return null;
        } else if (isNaN(Number(this.target.start))) {
            return null;
        } else {
            if (!isNaN(Number(this.target.end)) && this.target.start !== this.target.end) {
                return `t=${this.target.start},${this.target.end}`;
            }
            return `t=${this.target.start}`;
        }
    }

    get timeFragmentType(): TimeFragmentType | string {
        if (this.start !== undefined && !isNaN(this.start)) {
            if (this.end !== undefined && !isNaN(this.end)) {
                return TimeFragmentType.RANGE;
            }
            return TimeFragmentType.PUNCTUAL;
        }
        return TimeFragmentType.WHOLE;
    }

    set timeFragmentType(newTP: TimeFragmentType | string) {
        switch (newTP) {
            case TimeFragmentType.PUNCTUAL:
                this.end = undefined;
                break;
            case TimeFragmentType.WHOLE:
                this.start = undefined;
                this.end = undefined;
                break;
            case TimeFragmentType.RANGE:
                this.start = this.start ?? 0.5
                this.end = this.end ?? 1
                break;
        }
    }

    static fragmentToStartAndEnd(fragment: string): [number?, number?] {
        const params = /t=(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?/.exec(fragment)
        if (!params) {
            return [undefined, undefined];
        }
        return [parseFloat(params![1]), params?.[2] ? parseFloat(params[2]) : undefined];
    }

    /**
     * The values from the CE are enums, so don't contain the url prefix
     * @param motivationValue
     */
    static parseMotivationValue(motivationValue: string): DefaultAnnotationMotivation {
        switch (motivationValue) {
            // TODO: This doesn't contain all possible oa:Motivations.
            //  As the values from the CE are the same as the enum values we could do this better
            //  by just doing `DefaultAnnotationMotivation[value]`, but will still
            //  need to check what happens if it's an invalid/unexpected value
            case 'commenting':
                return DefaultAnnotationMotivation.COMMENTING;
            case 'describing':
                return DefaultAnnotationMotivation.DESCRIBING;
            case 'tagging':
                return DefaultAnnotationMotivation.TAGGING;
            case 'classifying':
                return DefaultAnnotationMotivation.CLASSIFYING;
            case 'assessing':
                return DefaultAnnotationMotivation.ASSESSING;
            case 'linking':
                return DefaultAnnotationMotivation.LINKING;
            default:
                throw new TypeError("Not known type")
        }
    }

    static fromCE(ceannotation: any, CE_URL: string): Annotation {
        // TODO: Optionally more than 1 target
        const targetNode = ceannotation.targetNode?.[0];
        const targetUrl = ceannotation.targetUrl?.[0];
        if (targetNode === undefined && targetUrl === undefined) {
            throw new TypeError("Annotation has no target")
        }
        let target: TrompaAnnotationComponents.AnnotationTarget;
        if (targetUrl !== undefined) {
            target = targetUrl
        } else {
            let start, end;
            if (targetNode?.fragment) {
                [start, end] = this.fragmentToStartAndEnd(targetNode.fragment)
            }
            let url: string = "";
            // TODO: The field of a CEAnnotationTarget could be anything, but in graphql we
            //  need to specify the exact fields that we want to return in a query
            //  For simplicity at the moment, just assume that it's one of
            //  (url, source) from ThingInterface, or contentUrl from MediaObjectInterface
            if (targetNode.field === null) {
                // Can be empty
                url = `${CE_URL}${CE_URL.endsWith("/") ? "" : "/"}${targetNode.target.identifier}`
            } else if (targetNode.field === "url") {
                url = targetNode.target.url;
            } else if (targetNode.field === "source") {
                url = targetNode.target.source;
            } else if (targetNode.field === "contentUrl") {
                url = targetNode.target.contentUrl;
            } else {
                throw new TypeError("Unsupported targetNode field value")
            }
            target = {
                identifier: targetNode.identifier,
                type: 'AnnotationTarget', nodeId: targetNode.target.identifier,
                fieldName: targetNode.field, url: url,
                start: start, end: end
            }
        }
        let body: TrompaAnnotationComponents.AnnotationBody;
        if (ceannotation.bodyUrl) {
            body = ceannotation.bodyUrl;
        } else if (ceannotation.bodyText && ceannotation.bodyText.length > 0) {
            const bodyNode = ceannotation.bodyText?.[0];
            body = {
                value: bodyNode.value, format: bodyNode.format,
                identifier: bodyNode.identifier, language: bodyNode.language,
                type: 'TextualBody'
            }
        } else if (ceannotation.bodyNode && ceannotation.bodyNode.length > 0) {
            const bodyNode = ceannotation.bodyNode?.[0];
            if (bodyNode.__typename === 'DefinedTerm') {
                body = {
                    identifier: bodyNode.identifier, type: 'DefinedTerm',
                    creator: bodyNode.creator, additionalType: bodyNode.additionalType,
                    termCode: bodyNode.termCode
                }
            } else if (bodyNode.__typename === 'Rating') {
                body = {
                    identifier: bodyNode.identifier, type: 'Rating',
                    creator: bodyNode.creator, bestRating: bodyNode.bestRating,
                    worstRating: bodyNode.worstRating, name: bodyNode.name,
                    additionalType: bodyNode.additionalType,
                    ratingValue: bodyNode.ratingValue
                }
            }
        }

        // Motivation. We always have a motivation value ("base motivation"), and possibly a custom
        // one. Custom motivation can be an external URL, a DefinedTerm, or an AnnotationCEMotivation
        const motivation: DefaultAnnotationMotivation = this.parseMotivationValue(ceannotation.motivation)

        let customMotivation: TrompaAnnotationComponents.AnnotationCustomMotivation;
        if (ceannotation.motivationUrl && ceannotation.motivationUrl.length > 0) {
            // TODO: this might be an array??
            customMotivation = ceannotation.motivationUrl[0];
        } else if (ceannotation.motivationDefinedTerm) {
            const definedTerm = ceannotation.motivationDefinedTerm;
            customMotivation = {
                type: 'DefinedTerm', identifier: definedTerm.identifier,
                creator: definedTerm.creator, additionalType: definedTerm.additionalType,
                termCode: definedTerm.termCode, broaderUrl: definedTerm.broaderUrl,
                broaderMotivation: definedTerm.broaderMotivation
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
        const newAnnotation = new Annotation(ceannotation.identifier, target, ceannotation.creator, ceannotation.created?.formatted,
            motivation, customMotivation, body);
        newAnnotation.isNew = false;
        return newAnnotation;
    }

    static fromSolid(): Annotation {
        const newAnnotation = new Annotation('1', '2')
        newAnnotation.isNew = false;
        return newAnnotation;
    }

}
