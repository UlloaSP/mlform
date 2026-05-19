---
title: Angular
description: Monta en ngAfterViewInit y limpia en ngOnDestroy.
---

```ts
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { mountForm, type MountedForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

@Component({
  selector: "app-prediction-form",
  template: "<div #host></div>",
})
export class PredictionFormComponent implements AfterViewInit, OnDestroy {
  @ViewChild("host", { static: true }) host!: ElementRef<HTMLElement>;
  private mounted?: MountedForm;

  ngAfterViewInit() {
    this.mounted = mountForm(this.host.nativeElement, {
      transport: createJsonTransport({ endpoint: "/api/predict" }),
      schema,
    });
  }

  ngOnDestroy() {
    this.mounted?.unmount();
  }
}
```
