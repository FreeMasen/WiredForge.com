type ListenerCallback = (eventName: string, eventData: any) => void

interface ArcerForm {
    controls: Map<string, HTMLInputElement>;
    listener: ListenerCallback;
    html(): HTMLDivElement;
    updateValue(id: string, value: number): void;
    inputGroup(labelText: string, inputId: string,
                inputType: string,  initialValue: string): HTMLDivElement;
    inputGroupGroup(...groups: Array<HTMLDivElement>): HTMLDivElement;
    controlGroup(name: string, group: HTMLDivElement): HTMLDivElement;
}