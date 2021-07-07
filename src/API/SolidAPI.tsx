import Annotation, {DefaultAnnotationMotivation} from "../annotations/Annotation";
import {
    getSolidDataset,
    getUrl,
    getThing,
    getContainedResourceUrlAll,
} from "@inrupt/solid-client";
import {WS} from "@inrupt/vocab-solid-common";
import {v4 as uuidv4} from "uuid";

type DefaultAnnotationMotivationType = `${DefaultAnnotationMotivation}`;

enum httpVerb {
    POST = 'POST',
    GET = 'GET',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH'
};

type httpVerbType= `${httpVerb}`;


export interface SolidTextualBody {
    id?: URL;
    type: string | URL;
    body: {
        type: "TextualBody";
        value: string;
        format: "text/html" | "text/plain" // TODO extend? or fall back to string?
        language?: string
    }
}

export interface SolidAnnotation{
    "@id"?: URL;
    target: URL | URL[];
    motivation?:DefaultAnnotationMotivationType | URL;
    // body?: URL | string | SolidTextualBody | (URL | string | SolidTextualBody)[] ; //TODO verify
    body?: URL | string | (URL | string)[];
}

export default class SolidClient {
    solidRESTInteraction = async(url: URL, method: httpVerbType, session:any, headers: object, payload: object|null) => { //FIXME change session type to appropriate "@inrupt" type, and consider "headers" type
        headers["content-type"] = "application/ld+json";
        headers["accept"] = "application/ld+json";
        // if POSTing ensure a payload exists and an "@id" is set
        if(method === "POST") {
            // prepare for payload URI after POST success (using @id and Slug)
            // use Slug if provided in headers, otherwise take the @id
            // warn if both are provided and there is a mismatch
            if(!payload || !("@id" in payload)) {
                console.warn('Cowardly refusing to POST without a JSON-LD payload with an "@id" set.')
                return null;
            } else if("Slug" in headers && payload["@id"] !== headers["Slug"]) {
                console.debug('Mismatch between top-level payload "@id" and Slug header. I hope you know what you are doing...')
            } else if(!("Slug" in headers)) {
                headers["Slug"] = payload["@id"] + ".jsonld";
            }
        }
        let fetchOptions = {method, headers};
        if(payload) { fetchOptions["body"] = JSON.stringify(payload) };
        return session.fetch!(url.toString(), fetchOptions)
            .then((response:any) => {
                console.log("Completed: ", response)
                return response;
            })
            .catch((err:any) => {
                console.error("Error with solidInteraction:", err);
                return err;
            })
    }

    saveAnnotation = async (annotation: SolidAnnotation, session:any) => { //FIXME change session type to appropriate "@inrupt" type
        let toSolid:any;
        toSolid = new Object;
        if("@id" in annotation) {
            toSolid["@id"] = annotation["@id"]!.toString()
        } else {
            toSolid["@id"] = uuidv4().toString()
        }
        if(!Array.isArray(annotation.target)) {
            annotation.target = [annotation.target]
        }
        // convert URL objects to strings
        toSolid.target = annotation.target.map((t) => t.toString())
        if(toSolid.target.length === 1) {
            toSolid.target = toSolid.target[0];
        }
        console.debug("About to post: ", toSolid, session)
        let profileDocUri = session.info!.webId!.split("#")[0];
        const profileDataset = await getSolidDataset(profileDocUri, { fetch: session.fetch});
        const profile = getThing(profileDataset, session.info!.webId!);
        let postUrl;
        if(profile) {
            const podUrl = getUrl(profile, WS.storage);
            if(podUrl) {
                postUrl = new URL(new URL(podUrl).origin + "/public/");
            } else {
                console.error("Could not determine POD URL from user's webId profile. Dangerously hacking it from webId URL instead!")
                postUrl = new URL(new URL(session.info!.webId!).origin + "/public/");
            }
        } else {
            console.error("Could not access user's profile. Dangerously hacking POD URL from webId URL instead!")
            postUrl = new URL(new URL(session.info!.webId!).origin + "/public/");
        }

        console.debug("Trying to post to URL: ", postUrl)
        const response = this.solidRESTInteraction(postUrl, httpVerb.POST, session, {}, toSolid);
        console.log("SaveAnnotation got response: ", response);
        return response;
    }

    deleteAnnotation = async (annotationUrl: URL, session: any) => { //FIXME change session type to appropriate "@inrupt" type
        console.debug("Trying to delete annotation at URL: ", annotationUrl.toString())
        return this.solidRESTInteraction(annotationUrl, httpVerb.DELETE, session, {}, null);
    }

    fetchAnnotation = async (annotationUrl: URL, session: any)=> { //FIXME change session type to appropriate "@inrupt" type
        console.debug("Trying to fetch annotation at URL: ", annotationUrl.toString())
        return await this.solidRESTInteraction(annotationUrl, httpVerb.GET, session, {}, null);
    }

    fetchAnnotations = async (containerUrl: URL, session: any, filter: object) => { //FIXME change session type to appropriate "@inrupt" type
        const containerDataset = await getSolidDataset(containerUrl.toString(), { fetch: session.fetch});
        const annotationUrls = await getContainedResourceUrlAll(containerDataset);
        const annotationPromises = annotationUrls.map((url) => {
            return this.fetchAnnotation(new URL(url), session);
        });
        const annotations = await Promise.all(annotationPromises).then((responses) => {
            // filter out responses with error status
            const goodResponses = responses.filter((resp) => {
                if(resp.status >= 400) {
                    console.error("Could not fetch annotation:", resp)
                }
                return resp.status < 400
            })
            // only include those annotations passing constraints specified in filter object
            // return those annotations...
            const readerPromises = goodResponses.map((resp) => {
                return resp.body.getReader().read();
            });

            return Promise.all(readerPromises).then((dataAllResponses) => {
                return dataAllResponses.map((data) => {
                    const decoded = new TextDecoder("utf-8").decode(data.value);
                    console.log("decoded:", decoded)
                    return JSON.parse(decoded);
                })
            });
        })
        console.log("After all waiting, got annotations:", annotations)
        const filtered = annotations.filter((anno) => {
            let passes = true;
            // ... with properties (keys) ...
            Object.keys(filter).forEach((key) => {
                // ... that have values matching the equivalent property values in the filter.
                if (key in anno) {
                    let valsInAnno = Array.isArray(anno[key]) ? anno[key] : [anno[key]];
                    let valsInFilter = Array.isArray(filter[key]) ? filter[key] : [filter[key]];
                    valsInFilter.forEach((val: any) => {
                        if (!(valsInAnno.includes(val))) {
                            // uh oh, filter's value for this key is not included in annotation
                            passes = false;
                        }
                    })
                } else {
                    // uh oh, filter on a property that this annotation doesn't include
                    passes = false;
                }
            });
            return passes;
        });
        console.log("After filter but before return", filtered)
        return filtered;
    }
}
/*
   fetchAnnotations(): Annotation[] {
// Fetch annotations and format as {id, start, end, data}
return [];
}

fetchAnnotationTypes(): DefaultAnnotationMotivation[] {
// Fetch annotation types
return [];
}*/
