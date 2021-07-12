import * as jsonld from "jsonld";

export default {
      "oa": "http://www.w3.org/ns/oa#",
      "dc": "http://purl.org/dc/elements/1.1/",
      "dcterms": "http://purl.org/dc/terms/",
      "dctypes": "http://purl.org/dc/dcmitype/",
      "foaf": "http://xmlns.com/foaf/0.1/",
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "skos": "http://www.w3.org/2004/02/skos/core#",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "iana": "http://www.iana.org/assignments/relation/",
      "owl": "http://www.w3.org/2002/07/owl#",
      "as": "http://www.w3.org/ns/activitystreams#",
      "schema": "http://schema.org/",
      "id": {
          "@type": "@id",
          "@id": "@id"
      },
      "type": {
          "@type": "@id",
          "@id": "@type"
      },
      "Annotation": "oa:Annotation",
      "Dataset": "dctypes:Dataset",
      "Image": "dctypes:StillImage",
      "Video": "dctypes:MovingImage",
      "Audio": "dctypes:Sound",
      "Text": "dctypes:Text",
      "TextualBody": "oa:TextualBody",
      "ResourceSelection": "oa:ResourceSelection",
      "SpecificResource": "oa:SpecificResource",
      "FragmentSelector": "oa:FragmentSelector",
      "CssSelector": "oa:CssSelector",
      "XPathSelector": "oa:XPathSelector",
      "TextQuoteSelector": "oa:TextQuoteSelector",
      "TextPositionSelector": "oa:TextPositionSelector",
      "DataPositionSelector": "oa:DataPositionSelector",
      "SvgSelector": "oa:SvgSelector",
      "RangeSelector": "oa:RangeSelector",
      "TimeState": "oa:TimeState",
      "HttpRequestState": "oa:HttpRequestState",
      "CssStylesheet": "oa:CssStyle",
      "Choice": "oa:Choice",
      "Person": "foaf:Person",
      "Software": "as:Application",
      "Organization": "foaf:Organization",
      "AnnotationCollection": "as:OrderedCollection",
      "AnnotationPage": "as:OrderedCollectionPage",
      "Audience": "schema:Audience",
      "Motivation": "oa:Motivation",
      "bookmarking": "oa:bookmarking",
      "classifying": "oa:classifying",
      "commenting": "oa:commenting",
      "describing": "oa:describing",
      "editing": "oa:editing",
      "highlighting": "oa:highlighting",
      "identifying": "oa:identifying",
      "linking": "oa:linking",
      "moderating": "oa:moderating",
      "questioning": "oa:questioning",
      "replying": "oa:replying",
      "reviewing": "oa:reviewing",
      "tagging": "oa:tagging",
      "auto": "oa:autoDirection",
      "ltr": "oa:ltrDirection",
      "rtl": "oa:rtlDirection",
      "body": {
          "@type": "@id",
          "@id": "oa:hasBody"
      },
      "target": {
          "@type": "@id",
          "@id": "oa:hasTarget"
      },
      "source": {
          "@type": "@id",
          "@id": "oa:hasSource"
      },
      "selector": {
          "@type": "@id",
          "@id": "oa:hasSelector"
      },
      "state": {
          "@type": "@id",
          "@id": "oa:hasState"
      },
      "scope": {
          "@type": "@id",
          "@id": "oa:hasScope"
      },
      "refinedBy": {
          "@type": "@id",
          "@id": "oa:refinedBy"
      },
      "startSelector": {
          "@type": "@id",
          "@id": "oa:hasStartSelector"
      },
      "endSelector": {
          "@type": "@id",
          "@id": "oa:hasEndSelector"
      },
      "renderedVia": {
          "@type": "@id",
          "@id": "oa:renderedVia"
      },
      "creator": {
          "@type": "@id",
          "@id": "dcterms:creator"
      },
      "generator": {
          "@type": "@id",
          "@id": "as:generator"
      },
      "rights": {
          "@type": "@id",
          "@id": "dcterms:rights"
      },
      "homepage": {
          "@type": "@id",
          "@id": "foaf:homepage"
      },
      "via": {
          "@type": "@id",
          "@id": "oa:via"
      },
      "canonical": {
          "@type": "@id",
          "@id": "oa:canonical"
      },
      "stylesheet": {
          "@type": "@id",
          "@id": "oa:styledBy"
      },
      "cached": {
          "@type": "@id",
          "@id": "oa:cachedSource"
      },
      "conformsTo": {
          "@type": "@id",
          "@id": "dcterms:conformsTo"
      },
      "items": {
          "@type": "@id",
          "@id": "as:items",
          "@container": "@list"
      },
      "partOf": {
          "@type": "@id",
          "@id": "as:partOf"
      },
      "first": {
          "@type": "@id",
          "@id": "as:first"
      },
      "last": {
          "@type": "@id",
          "@id": "as:last"
      },
      "next": {
          "@type": "@id",
          "@id": "as:next"
      },
      "prev": {
          "@type": "@id",
          "@id": "as:prev"
      },
      "audience": {
          "@type": "@id",
          "@id": "schema:audience"
      },
      "motivation": {
          "@type": "@vocab",
          "@id": "oa:motivatedBy"
      },
      "purpose": {
          "@type": "@vocab",
          "@id": "oa:hasPurpose"
      },
      "textDirection": {
          "@type": "@vocab",
          "@id": "oa:textDirection"
      },
      "accessibility": "schema:accessibilityFeature",
      "bodyValue": "oa:bodyValue",
      "format": "dc:format",
      "language": "dc:language",
      "processingLanguage": "oa:processingLanguage",
      "value": "rdf:value",
      "exact": "oa:exact",
      "prefix": "oa:prefix",
      "suffix": "oa:suffix",
      "styleClass": "oa:styleClass",
      "name": "foaf:name",
      "email": "foaf:mbox",
      "email_sha1": "foaf:mbox_sha1sum",
      "nickname": "foaf:nick",
      "label": "rdfs:label",
      "created": {
          "@id": "dcterms:created",
          "@type": "xsd:dateTime"
      },
      "modified": {
          "@id": "dcterms:modified",
          "@type": "xsd:dateTime"
      },
      "generated": {
          "@id": "dcterms:issued",
          "@type": "xsd:dateTime"
      },
      "sourceDate": {
          "@id": "oa:sourceDate",
          "@type": "xsd:dateTime"
      },
      "sourceDateStart": {
          "@id": "oa:sourceDateStart",
          "@type": "xsd:dateTime"
      },
      "sourceDateEnd": {
          "@id": "oa:sourceDateEnd",
          "@type": "xsd:dateTime"
      },
      "start": {
          "@id": "oa:start",
          "@type": "xsd:nonNegativeInteger"
      },
      "end": {
          "@id": "oa:end",
          "@type": "xsd:nonNegativeInteger"
      },
      "total": {
          "@id": "as:totalItems",
          "@type": "xsd:nonNegativeInteger"
      },
      "startIndex": {
          "@id": "as:startIndex",
          "@type": "xsd:nonNegativeInteger"
      }
} as jsonld.ContextDefinition;
