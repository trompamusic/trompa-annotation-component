import {startAndEndFromAnnotation} from "../utils";

export enum AnnotationMotivation {
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

export class NotAnAnnotationError extends Error {

}

export enum TextDirection {
    ltr = "ltr",
    rtl = "rtl",
    auto = "auto"
}

export enum AnnotationType {
    Dataset = "Dataset",
    Image = "Image",
    Video = "Video",
    Sound = "Sound",
    Text = "Text",
    TextualBody = "TextualBody"
}

export class AnnotationExternalWebResource {
    /** The IRI that identifies the Body or Target resource. */
    id: string;
    format?: string;
    language?: string;
    processingLanguage?: string;
    textDirection?: TextDirection | string;
    type?: AnnotationType | string;

    constructor(params: {id: string, format?: string, language?: string, processingLanguage?: string,
        textDirection?: TextDirection | string, type?: AnnotationType | string}) {
        this.id = params.id;
        this.format = params.format;
        this.language = params.language;
        this.processingLanguage = params.processingLanguage;
        this.textDirection = params.textDirection;
        this.type = params.type;
    }
}

export class AnnotationTextualBody extends AnnotationExternalWebResource {
    value: string;

    constructor(params: {id: string, format?: string, language?: string, processingLanguage?: string,
        textDirection?: TextDirection | string, value: string}) {
        super({...params, type: AnnotationType.TextualBody});
        this.value = params.value;
    }
}

export class AnnotationTarget extends AnnotationExternalWebResource {

    /**
     * Get the fragment for this target's id, omitting the #
     */
    get fragment() : string | undefined {
        const url = new URL(this.id);
        if (url.hash) {
            // Omit #
            return url.hash.substring(1);
        }
        return undefined;
    }

    /**
     * Set a url fragment on this target's id
     * @param fragment some fragment, not including the #
     */
    set fragment(fragment: string | undefined) {
        if (fragment) {
            const url = new URL(this.id);
            url.hash = `#${fragment}`;
            this.id = url.toString();
        }
    }

    /**
     * Given a fragment string that represents a time range, parse it to a start and end time.
     * @param fragment
     */
    static fragmentToStartAndEnd(fragment: string): [number?, number?] {
        const params = /t=(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?/.exec(fragment)
        if (!params) {
            return [undefined, undefined];
        }
        return [parseFloat(params![1]), params?.[2] ? parseFloat(params[2]) : undefined];
    }

    /**
     * If the target id's fragment is a time range, the start of that range
     */
    get fragmentStart(): number | undefined {
        if (this.fragment) {
            const [start, ] = AnnotationTarget.fragmentToStartAndEnd(this.fragment);
            return start;
        }
        return undefined;
    }

    /**
     * If the target id's fragment is a time range, the end of that range
     */
    get fragmentEnd(): number | undefined {
        if (this.fragment) {
            const [, end] = AnnotationTarget.fragmentToStartAndEnd(this.fragment);
            return end;
        }
        return undefined;
    }

    /**
     * Set this target's fragment to have a specific start time
     * @param start
     */
    set fragmentStart(start: number | undefined) {
        const existingEnd = this.fragmentEnd;
        // TODO: If < 0
        if (start) {
            this.fragment = this.timeString(start, existingEnd);
        }
    }

    /**
     * Set this target's fragment to have a specific end time
     * @param end
     */
    set fragmentEnd(end: number | undefined) {
        // TODO this.target.end = Math.max(this.target.start, end);
        // TODO: Should this raise an error if there's no start set?
        const existingStart = this.fragmentStart;
        if (end) {
            this.fragment = this.timeString(existingStart, end);
        }
    }

    timeString(start?: number, end?: number): string | undefined {
        if (isNaN(Number(start))) {
            return undefined;
        } else {
            if (!isNaN(Number(end)) && start !== end) {
                return `t=${start},${end}`;
            }
            return `t=${start}`;
        }
    }
}

export default class Annotation {
    identifier: string;
    motivation?: AnnotationMotivation;
    // TODO: Trompa-specific, should be part of above motivation
    customMotivation?: TrompaAnnotationComponents.AnnotationCustomMotivation;

    creator?: string;
    created?: string;
    body?: AnnotationExternalWebResource[] | TrompaAnnotationComponents.AnnotationBody[];
    target: AnnotationTarget[] | TrompaAnnotationComponents.AnnotationCETarget[];
    canonical?: string;
    via?: string;
    // TODO: Editor-specific, shouldn't be part of data model
    isNew: boolean = true;

    // TODO: Formatting
    constructor(params: {
        identifier: string,
        target: AnnotationTarget[] | TrompaAnnotationComponents.AnnotationCETarget[],
        creator?: string,
        created?: string,
        motivation?: AnnotationMotivation,
        customMotivation?: TrompaAnnotationComponents.AnnotationCustomMotivation,
        body?: AnnotationExternalWebResource[] | TrompaAnnotationComponents.AnnotationBody[],
        canonical?: string,
        via?: string}) {
        this.identifier = params.identifier;
        this.target = params.target;
        this.creator = params.creator;
        this.created = params.created;
        this.motivation = params.motivation;
        this.customMotivation = params.customMotivation;
        this.body = params.body;
        this.canonical = params.canonical;
        this.via = params.via;
        // TODO: Requires at least 1 target
    }

    get timeFragmentType(): TimeFragmentType | string {
        const [start, end] = startAndEndFromAnnotation(this);

        if (start !== undefined && !isNaN(start)) {
            if (end !== undefined && !isNaN(end)) {
                return TimeFragmentType.RANGE;
            }
            return TimeFragmentType.PUNCTUAL;
        }
        return TimeFragmentType.WHOLE;
    }

    set timeFragmentType(newTP: TimeFragmentType | string) {
        /*
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
         */
    }
}
