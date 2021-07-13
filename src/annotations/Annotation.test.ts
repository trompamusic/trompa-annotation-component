import {AnnotationTarget} from "./Annotation";

export {}

describe("Target fragments", () => {
   it("target with no fragment", () => {
       const target = new AnnotationTarget({id: "https://example.com/identifier"});
       expect(target.fragment).toEqual(undefined);
       expect(target.fragmentStart).toEqual(undefined);
       expect(target.fragmentEnd).toEqual(undefined);
   });

    it("target with some fragment", () => {
        const target = new AnnotationTarget({id: "https://example.com/identifier#fragment"});
        expect(target.fragment).toEqual("fragment");
        expect(target.fragmentStart).toEqual(undefined);
        expect(target.fragmentEnd).toEqual(undefined);
    });

    it("target with a time fragment", () => {
        const target = new AnnotationTarget({id: "https://example.com/identifier#t=1,4"});
        expect(target.fragment).toEqual("t=1,4");
        expect(target.fragmentStart).toEqual(1);
        expect(target.fragmentEnd).toEqual(4);
    });

    it("set a fragment", () => {
        const target = new AnnotationTarget({id: "https://example.com/identifier"});
        target.fragment = "fragment"
        expect(target.id).toEqual("https://example.com/identifier#fragment");
    });

    it("set a startTime", () => {
        const target = new AnnotationTarget({id: "https://example.com/identifier"});
        target.fragmentStart = 1;
        expect(target.id).toEqual("https://example.com/identifier#t=1");

        target.fragmentStart = 1.4;
        expect(target.id).toEqual("https://example.com/identifier#t=1.4");
    });

    it("set a startTime and endTime", () => {
        const target = new AnnotationTarget({id: "https://example.com/identifier"});
        target.fragmentStart = 1;
        target.fragmentEnd = 5.3
        expect(target.id).toEqual("https://example.com/identifier#t=1,5.3");
    });
});