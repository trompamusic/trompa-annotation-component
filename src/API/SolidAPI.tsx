import Annotation, {
    AnnotationMotivation,
    AnnotationExternalWebResource,
    AnnotationTextualBody
} from "../annotations/Annotation";
import {
    access,
    getSolidDataset,
    getUrl,
    getThing,
    getContainedResourceUrlAll,
} from "@inrupt/solid-client";
import {Session} from "@inrupt/solid-client-authn-browser"

import {WS} from "@inrupt/vocab-solid-common";
import {v4 as uuidv4} from "uuid";
import * as jsonld from 'jsonld';

type AnnotationMotivationType = `${AnnotationMotivation}`;

enum httpVerb {
    POST = 'POST',
    GET = 'GET',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH'
};

type httpVerbType= `${httpVerb}`;

export interface SolidAnnotation{
    "@id"?: URL;
    target: URL | URL[];
    motivation?: AnnotationMotivationType | URL;
    // body?: URL | string | SolidTextualBody | (URL | string | SolidTextualBody)[] ; //TODO verify
    body?: AnnotationExternalWebResource | AnnotationTextualBody | URL | ( AnnotationExternalWebResource | AnnotationTextualBody | URL)[];
}

export default class SolidClient {
    session: any; // TODO type should be Session, but that requires better typing for headers
    constructor(session:Session) {
        this.session = session;
    }

    solidRESTInteraction = async(url: URL, method: httpVerbType, headers: object, payload: object|null) => { //FIXME consider "headers" type
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
                headers["Slug"] = payload["@id"].substring(payload["@id"].lastIndexOf("/")+1);
            }
        }
        let fetchOptions = {method, headers};
        if(payload) { fetchOptions["body"] = JSON.stringify(payload) };
        return this.session.fetch!(url.toString(), fetchOptions)
            .then((response:any) => {
                return response;
            })
            .catch((err:any) => {
                console.error("Error with solidInteraction:", err);
                return err;
            })
    }

    isPublicReadable = async (resourceUri: URL) => {
        return await access.getPublicAccess(resourceUri.toString(), {fetch: this.session.fetch})
            .then(access => {
                if(access === null) {
                    console.warn("Could not check whether the following resource is public readable. User may not have view access, or resource access may have been modified with incompatible Solid authn library.", resourceUri)
                    return false;
                } else {
                    return access.read;
                }
            })
    }

    userControlsAccess = async (resourceUri: URL) => {
        return await access.getAgentAccess(resourceUri.toString(), this.session.info.webId.toString(), {fetch:this.session.fetch})
            .then(access => {
                if(access === null) {
                    console.warn("Could not check whether the user controls access over the following resource. Have you turned on 'Control' for this URI in the Solid Pod's trusted application preferences? Otherwise, resource access may have been modified with incompatible Solid authn library.", resourceUri)
                    return false;
                } else {
                    return access.controlRead;
                }
            })
    }

    grantPublicReadable = async(resourceUri: URL)  => {
        access.setPublicAccess(
            resourceUri.toString(),
            {read: true, write: false},
            {fetch: this.session.fetch}
        ).then(newAccess => {
            if(newAccess === null) {
                console.warn("Could not load access details for resource at ", resourceUri.toString())
            } else {
                console.debug("After revokePublicReadable on ", resourceUri.toString(), " public access is: ", newAccess);
            }
        })
    }

    revokePublicReadable = async(resourceUri: URL)  => {
        access.setPublicAccess(
            resourceUri.toString(),
            {read: false, write: false},
            {fetch: this.session.fetch}
        ).then(newAccess => {
            if(newAccess === null) {
                console.warn("Could not load access details for resource at ", resourceUri.toString())
            } else {
                console.debug("After revokePublicReadable on ", resourceUri.toString(), " public access is: ", newAccess);
            }
        })
    }

    saveAnnotation = async (annotation: object, container: string) => {
        //FIXME annotation no longer of type SolidAnnotation; revise that interface, or fall back to 'object' like now if acceptable.
        let profileDocUri = this.session.info!.webId!.split("#")[0];
        const profileDataset = await getSolidDataset(profileDocUri, { fetch: this.session.fetch});
        const profile = getThing(profileDataset, this.session.info!.webId!);
        let postUrl:URL;
        if (!container.startsWith('/')) {
            container = '/' + container;
        }

        if (profile) {
            const podUrl = getUrl(profile, WS.storage);
            if(podUrl) {
                postUrl = new URL(new URL(podUrl).origin + container);
            } else {
                console.error("Could not determine POD URL from user's webId profile. Dangerously hacking it from webId URL instead!")
                postUrl = new URL(new URL(this.session.info!.webId!).origin + container);
            }
        } else {
            console.error("Could not access user's profile. Dangerously hacking POD URL from webId URL instead!")
            postUrl = new URL(new URL(this.session.info!.webId!).origin + container);
        }

        if("@id" in annotation) {
            annotation["@id"] = annotation["@id"]!.toString()
        } else {
            annotation["@id"] = postUrl.origin + container + uuidv4().toString() + ".jsonld";
        }
        annotation["@context"] = "http://www.w3.org/ns/anno.jsonld";
        annotation["@type"] = "Annotation";
        return this.solidRESTInteraction(postUrl, httpVerb.POST, {}, annotation);
    }

    deleteAnnotation = async (annotationUrl: URL) => {
        console.debug("Trying to delete annotation at URL: ", annotationUrl.toString())
        return this.solidRESTInteraction(annotationUrl, httpVerb.DELETE, {}, null);
    }

    fetchAnnotation = async (annotationUrl: URL)=> {
        console.debug("Trying to fetch annotation at URL: ", annotationUrl.toString())
        return await this.solidRESTInteraction(annotationUrl, httpVerb.GET, {}, null);
    }

    fetchAnnotations = async (containerUrl: URL, filter: object) => {
        const containerDataset = await getSolidDataset(containerUrl.toString(), { fetch: this.session.fetch});
        const annotationUrls = await getContainedResourceUrlAll(containerDataset);

        const annotationPromises = annotationUrls.map((url) => {
            return this.fetchAnnotation(new URL(url));
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
                    try {
                        return JSON.parse(decoded);
                    } catch {
                        console.error("Error parsing json document, skipping");
                        console.log(decoded);
                        return null;
                    }
                }).filter(d => d !== null)
            });
        })
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
        console.debug("fetchAnnotations returning the following filtered list of annotations:", filtered);
        return filtered;
    }
}
/*
   fetchAnnotations(): Annotation[] {
// Fetch annotations and format as {id, start, end, data}
return [];
}

fetchAnnotationTypes(): AnnotationMotivation[] {
// Fetch annotation types
return [];
}*/
