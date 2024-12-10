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

        // Initialize selected items from the hidden field values
        const hiddenFieldValues = JSON.parse(context.parameters.hiddenField.raw || "[]");
        this._selectedItems = hiddenFieldValues;

        // Optional fields for email and mobile
        this.subTextField1 = context.parameters.LookupOption1LogicalName?.raw || "";
        this.subTextField2 = context.parameters.LookupOption2LogicalName?.raw || "";

        // Create the main field for displaying selected items and toggle button
        this._mainField = document.createElement("div");
        this._mainField.className = "main-field";

        // Create the container for selected items
        this._selectedItemsContainer = document.createElement("div");
        this._selectedItemsContainer.className = "selected-items-container";

        // Create the search input field container
        this._searchInputContainer = document.createElement("div");
        this._searchInputContainer.className = "search-input-container";

        // Create the search input field
        this._searchInput = document.createElement("input");
        this._searchInput.type = "text";
        this._searchInput.className = "search-input";
        this._searchInput.placeholder = "Search here";
        // Debounced search to improve performance
        this._searchInput.addEventListener("input", this.debounce(this.filterItems.bind(this), 300));

        // Create the search icon
        this._searchIcon = document.createElement("i");
        this._searchIcon.className = "fas fa-search search-icon";
        this._searchIcon.addEventListener("click", this.toggleDropdown.bind(this));

        // Append search input and icon to the container
        this._searchInputContainer.appendChild(this._searchInput);
        this._searchInputContainer.appendChild(this._searchIcon);

        // Create the dropdown container for checkboxes
        this._dropdownContainer = document.createElement("div");
        this._dropdownContainer.className = "dropdown-container";
        this._dropdownContainer.style.display = "none"; // Hide by default

        // Load items from the specified entity
        this.loadItems(context);

        // Append the selected items container, search input container, and dropdown to the main field
        this._mainField.appendChild(this._selectedItemsContainer);
        this._mainField.appendChild(this._searchInputContainer);
        this._mainField.appendChild(this._dropdownContainer);

        // Append the main field to the container
        this._container.appendChild(this._mainField);

        // Inject CSS styles
        this.injectCSS();

        // Initial view update
        this.updateView(context);
    }

    /**
     * Creates a debounced version of the provided function.
     * The debounced function delays invoking the function until after
     * wait milliseconds have elapsed since the last time it was invoked.
     *
     * @param func - The function to debounce.
     * @param wait - The number of milliseconds to delay.
     * @returns A new debounced function.
     */
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

    private retrieveData(entityLogicalName: string, fieldLogicalName: string): void {
        let selectFields = fieldLogicalName + "," + entityLogicalName + "id";
        if (this.subTextField1) {
            selectFields += "," + this.subTextField1;
        }
        if (this.subTextField2) {
            selectFields += "," + this.subTextField2;
        }

        Xrm.WebApi.retrieveMultipleRecords(entityLogicalName, "?$select=" + selectFields).then(
            (result: any) => {
                const lookupData: ComponentFramework.LookupValue[] = result.entities.map((entity: any) => {
                    return {
                        id: entity[entityLogicalName + "id"],
                        entityType: entityLogicalName,
                        name: entity[fieldLogicalName],
                        subText1: this.subTextField1 ? entity[this.subTextField1] : "",
                        subText2: this.subTextField2 ? entity[this.subTextField2] : ""
                    };
                });
                console.log("Lookup Data:", lookupData);
                this.populateDropdown(lookupData);
                this.syncCheckboxes(); // Synchronize checkboxes with selected items
            },
            (error: any) => {
                console.error("API Error:", error.message);
                const errorDiv = document.createElement("div");
                errorDiv.className = "error-message";
                errorDiv.textContent = "Error occured while retrieving records, please try after some time";
                this._container.appendChild(errorDiv);
            }
        );
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
        } else {
            this._selectedItems = this._selectedItems.filter(i => i.id !== item.id);
        }
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
        // Clear existing selected items
        this._selectedItemsContainer.innerHTML = '';

        // Sort selected items alphabetically by name
        this._selectedItems.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        this._selectedItems.forEach(item => {
            const selectedItemDiv = document.createElement('div');
            selectedItemDiv.className = 'selected-item';
            selectedItemDiv.id = `selected-${item.id}`; // Assign an ID for scrollIntoView

            // Create a link element for each selected item
            const selectedItemLink = document.createElement('a');
            selectedItemLink.className = 'selected-item-link';
            selectedItemLink.textContent = item.name || '';
            selectedItemLink.href = 'javascript:void(0);'; // Prevent default link behavior

            // Add click event to open the record
            selectedItemLink.addEventListener('click', () => {
                this.openRecord(item);
            });

            const crossIcon = document.createElement('span');
            crossIcon.className = 'cross-icon';
            crossIcon.innerHTML = '&#10006;';

            crossIcon.addEventListener('click', () => {
                this.deselectItem(item);
            });

            selectedItemDiv.appendChild(selectedItemLink);
            selectedItemDiv.appendChild(crossIcon);
            this._selectedItemsContainer.appendChild(selectedItemDiv);
        });

        // Append the search input container and dropdown to the main field
        // Ensure selected items are displayed before search and dropdown
        // Remove any existing search and dropdown to prevent duplication
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

            const checkbox = this._dropdownContainer.querySelector(`#checkbox-${item.id}`) as HTMLInputElement;
            if (checkbox) {
                checkbox.checked = false;
            }

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
        return {
            hiddenField: JSON.stringify(this._selectedItems)
        };
    }

    public destroy(): void {
        // Cleanup code if needed
    }
}
