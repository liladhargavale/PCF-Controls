import { IInputs, IOutputs } from "./generated/ManifestTypes";
declare const Xrm: any;

export class LookupMultiSelect implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _selectedItems: ComponentFramework.LookupValue[] = [];
    private _container: HTMLDivElement;
    private _mainField: HTMLDivElement;
    private _dropdownContainer: HTMLDivElement;
    private _searchInputContainer: HTMLDivElement;
    private _searchInput: HTMLInputElement;
    private _searchIcon: HTMLElement;
    private _notifyOutputChanged: () => void;
    private subTextField1: string | "";
    private subTextField2: string | "";
    private _selectedItemsContainer: HTMLDivElement; // Container for selected items
    private _dropdownScrollTop: number = 0; // To maintain scroll position
    // newly added for button
    private _lookupEntityLogicalName: string;
    private _nameFieldLogicalName: string;
     private _lookupEntityDisplayName: string;
     private _newButton: HTMLButtonElement;

      // New property for NamesField
    private _namesFieldValue: string = "";
    
    constructor() {
        // Initialize variables if needed
    }

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._container = container;
        this._notifyOutputChanged = notifyOutputChanged;
        this._lookupEntityDisplayName = context.parameters.LookupEntityDisplayName.raw || "Record";
        this._lookupEntityLogicalName = context.parameters.LookupEntityLogicalName.raw || "";
        this._nameFieldLogicalName = context.parameters.NameFieldLogicalName.raw || "";

        // 🔑 Fixed 1: Separate hidden field parsing logic
        this.parseHiddenField(context);

        // Optional fields
        this.subTextField1 = context.parameters.LookupOption1LogicalName?.raw || "";
        this.subTextField2 = context.parameters.LookupOption2LogicalName?.raw || "";

        // Create UI first to show selected items immediately
        this.createMainField();
        this.injectCSS();
        
        // 🔑 Fixed 2: Initial UI update before data load
        this.updateView();

        // Load async data after UI setup
        this.loadItems(context);
    }

    // 🔑 Fixed 3: Dedicated method for hidden field parsing
    private parseHiddenField(context: ComponentFramework.Context<IInputs>): void {
        try {
            const hiddenFieldRaw = context.parameters.hiddenField.raw;
            this._selectedItems = hiddenFieldRaw ? 
                JSON.parse(hiddenFieldRaw) : 
                [];
        } catch (error) {
            console.error("Error parsing hiddenField:", error);
            this._selectedItems = [];
        }
        this.updateNamesField();
    }

    private createMainField(): void {
        this._mainField = document.createElement("div");
        this._mainField.className = "main-field";

        // Create New button
        this._newButton = document.createElement("button");
        this._newButton.className = "new-entity-button";
        this._newButton.textContent = `New ${this._lookupEntityDisplayName}`;
        this._newButton.addEventListener("click", this.openNewForm.bind(this));

        // Selected items container
        this._selectedItemsContainer = document.createElement("div");
        this._selectedItemsContainer.className = "selected-items-container";

        // Search input container
        this._searchInputContainer = document.createElement("div");
        this._searchInputContainer.className = "search-input-container";

        // Search elements
        this._searchInput = document.createElement("input");
        this._searchInput.type = "text";
        this._searchInput.className = "search-input";
        this._searchInput.placeholder = "Search here";
        this._searchInput.addEventListener("input", this.debounce(this.filterItems.bind(this), 300));

        this._searchIcon = document.createElement("i");
        this._searchIcon.className = "fas fa-search search-icon";
        this._searchIcon.addEventListener("click", this.toggleDropdown.bind(this));

        // Dropdown container
        this._dropdownContainer = document.createElement("div");
        this._dropdownContainer.className = "dropdown-container";
        this._dropdownContainer.style.display = "none";

        // Assemble components
        this._searchInputContainer.appendChild(this._searchInput);
        this._searchInputContainer.appendChild(this._searchIcon);
        
        this._mainField.appendChild(this._selectedItemsContainer);
        this._mainField.appendChild(this._newButton);
        this._mainField.appendChild(this._searchInputContainer);
        this._mainField.appendChild(this._dropdownContainer);
        this._container.appendChild(this._mainField);
    }


    private retrieveData(entityLogicalName: string, fieldLogicalName: string, filter?: string): void {
        const selectFields = `${fieldLogicalName},${entityLogicalName}id${this.subTextField1 ? `,${this.subTextField1}` : ""}${this.subTextField2 ? `,${this.subTextField2}` : ""}`;
    let query = `?$select=${selectFields}`;

    // Always filter active records (statecode eq 0)
    const filterConditions: string[] = ["statecode eq 0"];
    if (filter) {
        filterConditions.push(filter);
    }

    query += `&$filter=${encodeURIComponent(filterConditions.join(" and "))}`;

        Xrm.WebApi.retrieveMultipleRecords(entityLogicalName, query).then(
            (result: any) => {
                const lookupData: ComponentFramework.LookupValue[] = result.entities.map((entity: any) => ({
                    id: entity[`${entityLogicalName}id`],
                    entityType: entityLogicalName,
                    name: entity[fieldLogicalName],
                    subText1: this.subTextField1 ? entity[this.subTextField1] : "",
                    subText2: this.subTextField2 ? entity[this.subTextField2] : ""
                }));
                
                this.populateDropdown(lookupData);
                this.syncCheckboxes();
            },
            (error: any) => {
                console.error("API Error:", error.message);
                //this.showErrorMessage("Error retrieving records");
            }
        );
    }

    // New method to update NamesField
    private updateNamesField(): void {
        this._namesFieldValue = this._selectedItems.map(item => item.name).join(", ");
        this._notifyOutputChanged(); // Notify framework to update outputs
    }

    // Example method to add a new item (for reference)
    // private addItem(item: ComponentFramework.LookupValue): void {
    //     if (!this._selectedItems.some(i => i.id === item.id)) {
    //         this._selectedItems.push(item);
    //         this.updateNamesField(); // Update NamesField when item is added
    //         //this._notifyOutputChanged();
    //     }
    // }

    // // Example method to remove an item (for reference)
    // private removeItem(item: ComponentFramework.LookupValue): void {
    //     this._selectedItems = this._selectedItems.filter(i => i.id !== item.id);
    //     this.updateNamesField(); // Update NamesField when item is removed
    //     //this._notifyOutputChanged();
    // }

    private openNewForm(): void {
        const formOptions = {
            entityName: this._lookupEntityLogicalName,
            useQuickCreateForm: true
        };
    
        Xrm.Navigation.openForm(formOptions).then(
            (result: any) => {
                // Check if the result contains the saved entity reference
                if (result && result.savedEntityReference && result.savedEntityReference.length > 0) {
                    const newRecordId = result.savedEntityReference[0].id;
                    this.retrieveSpecificRecord(newRecordId);
                } else {
                    console.log("No new record was created.");
                }
            },
            (error: any) => {
                console.error("Error opening form:", error);
            }
        );
    }

    private retrieveSpecificRecord(recordId: string): void {
        const selectFields = `${this._nameFieldLogicalName},${this._lookupEntityLogicalName}id${this.subTextField1 ? `,${this.subTextField1}` : ""}${this.subTextField2 ? `,${this.subTextField2}` : ""}`;
        const query = `?$select=${selectFields}&$filter=${this._lookupEntityLogicalName}id eq ${recordId}`;
    
        Xrm.WebApi.retrieveRecord(this._lookupEntityLogicalName, recordId, query).then(
            (newRecord: any) => {
                const lookupValue: ComponentFramework.LookupValue = {
                    id: newRecord[`${this._lookupEntityLogicalName}id`],
                    entityType: this._lookupEntityLogicalName,
                    name: newRecord[this._nameFieldLogicalName],
                    subText1: this.subTextField1 ? newRecord[this.subTextField1] : "",
                    subText2: this.subTextField2 ? newRecord[this.subTextField2] : ""
                };
    
                if (!this._selectedItems.some(item => item.id === lookupValue.id)) {
                    this._selectedItems.push(lookupValue);

                    //this.addItem(lookupValue);
                    this.updateNamesField();
                    this._notifyOutputChanged();
                    // Refresh dropdown data to include the new record
                    this.retrieveData(this._lookupEntityLogicalName, this._nameFieldLogicalName); 
                    this.updateView();
                }
            },
            (error: any) => {
                console.error("Error retrieving new record:", error);
            }
        );
    }

    private debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
        let timeout: number | undefined;
        return (...args: Parameters<T>) => {
            if (timeout !== undefined) {
                clearTimeout(timeout);
            }
            timeout = window.setTimeout(() => func.apply(this, args), wait);
        };
    }

    private injectCSS(): void {
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
    }

    private loadItems(context: ComponentFramework.Context<IInputs>): void {
        const lookupEntityLogicalName = context.parameters.LookupEntityLogicalName.raw || "";
        const NameFieldLogicalName = context.parameters.NameFieldLogicalName.raw || "";

        // Fetch data dynamically from the CRM
        this.retrieveData(lookupEntityLogicalName, NameFieldLogicalName);
        this.syncCheckboxes();
    }

    private populateDropdown(lookupData: ComponentFramework.LookupValue[]): void {
        // Clear existing options
        this._dropdownContainer.innerHTML = "";

        // Sort lookupData alphabetically by name
        lookupData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        lookupData.forEach(item => {    
            const optionDiv = document.createElement("div");
            optionDiv.className = "lookup-option";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = item.id;
            checkbox.id = `checkbox-${item.id}`;
            checkbox.addEventListener("change", (event) => this.onCheckboxChange(event, item));

            const label = document.createElement("label");
            label.htmlFor = `checkbox-${item.id}`;
            label.textContent = item.name || "";

            const subText = document.createElement("div");
            subText.className = "sub-text";

            if (item.subText1 && item.subText1.trim() !== "") {
                subText.textContent = item.subText1;
            } else if (item.subText2 && item.subText2.trim() !== "") {
                subText.textContent = item.subText2;
            } else {
                subText.textContent = "";
            }

            optionDiv.appendChild(checkbox);
            optionDiv.appendChild(label);
            optionDiv.appendChild(subText);

            this._dropdownContainer.appendChild(optionDiv);

            // Add hover effect
            optionDiv.addEventListener("mouseover", () => {
                optionDiv.style.backgroundColor = "#f0f0f0";
            });
            optionDiv.addEventListener("mouseout", () => {
                optionDiv.style.backgroundColor = "";
            });

            // Toggle checkbox on clicking the entire option
            optionDiv.addEventListener("click", (event) => {
                event.preventDefault(); // Prevent the default scroll behavior
                event.stopPropagation(); // Prevent event from bubbling up
                checkbox.checked = !checkbox.checked; // Toggle checkbox
                this.onCheckboxChange({ target: checkbox } as unknown as Event, item); // Trigger change event
            });

            // Prevent scrolling to top on checkbox toggle
            checkbox.addEventListener("click", (event) => {
                event.preventDefault(); // Prevent the default scroll behavior
                event.stopPropagation(); // Prevent checkbox click from propagating
            });
        });

        // Implement virtualization if the list is very large
        // This is a placeholder; actual virtualization would require more complex implementation
        // Consider using libraries like Virtual Scroller for better performance
    } 

    private onCheckboxChange(event: Event, item: ComponentFramework.LookupValue): void {
        const checkbox = event.target as HTMLInputElement;
        if (checkbox.checked) {
            // Check if the item is already selected to prevent duplicates
            if (!this._selectedItems.some(i => i.id === item.id)) {
                this._selectedItems.push(item);
                // Scroll to the newly added selected item
                setTimeout(() => {
                    const selectedItemElement = this._selectedItemsContainer.querySelector(`#selected-${item.id}`);
                    if (selectedItemElement) {
                        selectedItemElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                }, 100); // Slight delay to ensure DOM update
            }

            //this.addItem(item);
        } else {
            this._selectedItems = this._selectedItems.filter(i => i.id !== item.id);

            //this.removeItem(item);
        }

        this.updateNamesField();
        this._notifyOutputChanged();
        this.updateView();
    }

    private filterItems(): void {
        const searchText = this._searchInput.value.trim().toLowerCase();
        const options = this._dropdownContainer.querySelectorAll('.lookup-option');

        options.forEach((option: Element) => {
            const label = (option.querySelector('label') as HTMLLabelElement)?.textContent || '';
            if (label.toLowerCase().includes(searchText)) {
                (option as HTMLDivElement).style.display = 'flex';
            } else {
                (option as HTMLDivElement).style.display = 'none';
            }
        });

        // Show or hide the dropdown container based on the search text
        if (searchText.length > 0) {
            this._dropdownContainer.style.display = 'flex';
        } else {
            this._dropdownContainer.style.display = 'none';
        }
    }

    private toggleDropdown(): void {
        const searchText = this._searchInput.value.trim().toLowerCase();
        const isDropdownVisible = this._dropdownContainer.style.display === 'flex';
        if (isDropdownVisible) {
            this._dropdownContainer.style.display = 'none';
        } else {
            if (searchText.length > 0) {
                this.filterItems();
            } else {
                this._dropdownContainer.style.display = 'flex';
            }
        }
    }

    public updateView(context?: ComponentFramework.Context<IInputs>): void {
        // 🔑 Fixed 4: Check for context updates
        if(context && context.parameters.hiddenField.raw !== JSON.stringify(this._selectedItems)) {
            this.parseHiddenField(context);
        }

        // Existing rendering logic
        this._selectedItemsContainer.innerHTML = '';
        this._selectedItems.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        this._selectedItems.forEach(item => {
            const selectedItemDiv = document.createElement('div');
            selectedItemDiv.className = 'selected-item';
            selectedItemDiv.id = `selected-${item.id}`;

            const selectedItemLink = document.createElement('a');
            selectedItemLink.className = 'selected-item-link';
            selectedItemLink.textContent = item.name || '';
            selectedItemLink.href = 'javascript:void(0);';
            selectedItemLink.addEventListener('click', () => this.openRecord(item));

            const crossIcon = document.createElement('span');
            crossIcon.className = 'cross-icon';
            crossIcon.innerHTML = '&#10006;';
            crossIcon.addEventListener('click', () => this.deselectItem(item));

            selectedItemDiv.appendChild(selectedItemLink);
            selectedItemDiv.appendChild(crossIcon);
            this._selectedItemsContainer.appendChild(selectedItemDiv);
        });

        // Maintain UI elements
        if (!this._mainField.contains(this._searchInputContainer)) {
            this._mainField.appendChild(this._searchInputContainer);
        }
        if (!this._mainField.contains(this._dropdownContainer)) {
            this._mainField.appendChild(this._dropdownContainer);
        }

        this.syncCheckboxes();
    }

    private openRecord(item: ComponentFramework.LookupValue): void {
        const entityFormOptions = {
            entityName: item.entityType,
            entityId: item.id,
        };

        Xrm.Navigation.openForm(entityFormOptions).then(
            function success() {
                console.log("Record opened successfully");
            },
            function error(error:any) {
                console.error(error.message);
            }
        );
    }

    private deselectItem(item: ComponentFramework.LookupValue): void {
        const index = this._selectedItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
            this._selectedItems.splice(index, 1);
            //this.removeItem(item); // Remove item when cross icon is clicked
            // const checkbox = this._dropdownContainer.querySelector(`#checkbox-${item.id}`) as HTMLInputElement;
            // if (checkbox) {
            //     checkbox.checked = false;
            // }
            this.updateNamesField();
            this._notifyOutputChanged();
            this.updateView();

            // Optional: Maintain scroll position after removal
            // This can be enhanced based on specific requirements
        }
    }

    private syncCheckboxes(): void {
        const checkboxes = this._dropdownContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
            const inputElement = checkbox as HTMLInputElement;
            const isChecked = this._selectedItems.some(item => item.id === inputElement.value);
            inputElement.checked = isChecked;
        });
    }

    public getOutputs(): IOutputs {
        // return {
        //     hiddenField: JSON.stringify(this._selectedItems),
        //     recordNamesField: this._namesFieldValue // New NamesField
            
        // };
        return {
            hiddenField: this._selectedItems.length > 0 ? 
                JSON.stringify(this._selectedItems) : 
                "", // 🔑 Fixed 5: Return empty string instead of empty array
            recordNamesField: this._namesFieldValue
        };
    }

    public destroy(): void {
        // Cleanup code if needed
    }
}
