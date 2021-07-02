import {Component} from "react";
import Annotation, {DefaultAnnotationMotivation} from "../annotations/Annotation";
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
        session.fetch!(url.toString(), fetchOptions)
            .then((response:any) => console.log("Success: ", response))
            .catch((err:any) => console.error("Error with solidInteraction:", err)) 
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
        // FIXME HACK For now, determine Solid container URI by hacking the WebId. NOT GOOD. Read pim:storage from profile instead
        let postUrl = new URL(new URL(session.info!.webId!).origin + "/public/")
        console.debug("Trying to post to URL: ", postUrl)
        this.solidRESTInteraction(postUrl, httpVerb.POST, session, {}, toSolid)
    }

    deleteAnnotation = async (annotation: Annotation) => {
        const {identifier, start, end, body} = annotation;
        if (!identifier) {
            // Throw error, can't delete an annotation without an ID
        } else {
            // Delete existing annotation
        }
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
