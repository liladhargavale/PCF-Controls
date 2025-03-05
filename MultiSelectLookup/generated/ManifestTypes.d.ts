/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    selectedItems: ComponentFramework.PropertyTypes.LookupProperty;
    hiddenField: ComponentFramework.PropertyTypes.StringProperty;
    recordNamesField: ComponentFramework.PropertyTypes.StringProperty;
    LookupEntityLogicalName: ComponentFramework.PropertyTypes.StringProperty;
    LookupEntityDisplayName: ComponentFramework.PropertyTypes.StringProperty;
    NameFieldLogicalName: ComponentFramework.PropertyTypes.StringProperty;
    LookupOption1LogicalName: ComponentFramework.PropertyTypes.StringProperty;
    LookupOption2LogicalName: ComponentFramework.PropertyTypes.StringProperty;
}
export interface IOutputs {
    selectedItems?: ComponentFramework.LookupValue[];
    hiddenField?: string;
    recordNamesField?: string;
}
