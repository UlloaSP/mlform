---
title: Angular
description: Mount MLForm from an Angular component.
---

```ts
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { mountForm, type MountedForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

@Component({
  selector: "app-prediction-form",
  template: `<div #host></div>`,
})
export class PredictionFormComponent implements AfterViewInit, OnDestroy {
  @ViewChild("host", { static: true }) host!: ElementRef<HTMLElement>;
  private mounted?: MountedForm;

  ngAfterViewInit() {
    this.mounted = mountForm(this.host.nativeElement, {
      transport: createJsonTransport({ endpoint: "/api/predict" }),
      schema: {
        fields: [{ id: "prompt", kind: "text", label: "Prompt", required: true }],
        reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
      },
    });
  }

  ngOnDestroy() {
    this.mounted?.unmount();
  }
}
```
