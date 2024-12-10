# 📢 LookupMultiSelect PCF Control

## 📘 Introduction
The **LookupMultiSelect PCF Control** is a powerful enhancement for **Microsoft Dynamics 365 (D365)** that allows users to select multiple records from lookup fields. This control significantly improves **user experience**, **data management**, and **efficiency** by allowing users to select multiple related records (like multiple contacts for an account) in one go.

---

## 🎯 Purpose
The purpose of the **LookupMultiSelect PCF Control** is to solve the limitation of **standard lookup fields** in Dynamics 365, which only allow single record selection. This control enables users to **select multiple lookup records** at once, making data association simpler, faster, and more efficient.

### **Key Objectives**
- **Enhance Usability**: Allow users to select multiple records in one go.
- **Improve Data Management**: Better association of multiple records to a single parent record.
- **Boost Productivity**: Reduce clicks and time required to associate multiple records.

---

## ✨ Benefits
Using the **LookupMultiSelect PCF Control** in Dynamics 365 offers the following key advantages:

- **Multi-Select Capability**: Select multiple lookup records at once.
- **Dynamic Search**: Search bar with debounced input for faster lookup, even in large datasets.
- **Mobile Responsive**: Works across desktops, tablets, and mobile devices.
- **Enhanced Display**: View selected records with quick navigation links.
- **Performance Optimization**: Handles large datasets efficiently.
- **Customizable Subtext**: Display additional context (like email, phone) for selected records.
- **Data Integrity**: Uses a hidden field to store references for selected records, ensuring data consistency.

---

## 📥 Installation and Setup
To get started with the **LookupMultiSelect PCF Control**, follow these steps:

### ** [1] Download from PCF Gallery**
1. Visit the [PCF Gallery](https://pcf.gallery/).
2. Search for **LookupMultiSelect**.
3. Download the **LookupMultiSelect.zip** file.

---

### ** [2] ️Import Managed Solution into Dynamics 365**
1. **Log in to Dynamics 365**: Use admin credentials.
2. **Go to Solutions**: **Settings > Solutions**.
3. **Import the Solution**:
   - Click **Import** and select the **LookupMultiSelect_Managed.zip** file. (file path is ./MultiSelectLookup/LookupMultiSelectSolution/bin/debug/)
   - Follow the wizard to complete the import process.
4. **Verify Import**: Check if the **LookupMultiSelect control** appears in the **Managed Solutions list**.

---

### ** [3️] Register and Configure the Control**
1. **Open the Form Editor**: 
   - **Settings > Customizations > Customize the System**.
   - Select the entity where you want to use the **LookupMultiSelect PCF Control**.
2. **Add the LookupMultiSelect Control**:
   - Choose the field where you want multi-select functionality.
   - Go to the **Controls tab**, click **Add Control**, and select **LookupMultiSelect_Control**.
3. **Configure Control Properties**:
   - **LookupEntityLogicalName**: Logical name of the target entity (e.g., `contact`, `account`).
   - **NameFieldLogicalName**: Logical name of the field that will be displayed (e.g., `fullname`, `name`).
   - **LookupOption1LogicalName** (Optional): Field name for subtext (like email) (e.g., `emailaddress1`).
   - **LookupOption2LogicalName** (Optional): Another subtext field (e.g., `mobilephone`).
   - **hiddenField**: This field stores **JSON data for selected lookup records**. It should be a **Multiple Lines of Text** field.

---

## 📐 Control Properties
When adding **LookupMultiSelect_Control**, you will configure the following properties:

| **Property Name**         | **Required?** | **Description**                             | **Example**          |
|--------------------------|---------------|---------------------------------------------|---------------------|
| **LookupEntityLogicalName** | ✅ Required  | Logical name of the target entity.         | `contact`, `account` |
| **NameFieldLogicalName**    | ✅ Required  | Field name to display in the lookup.       | `fullname`, `name`   |
| **LookupOption1LogicalName**| ⭕ Optional | Subtext field 1 (like email).              | `emailaddress1`      |
| **LookupOption2LogicalName**| ⭕ Optional | Subtext field 2 (like mobile).             | `mobilephone`        |
| **hiddenField**             | ✅ Required  | Stores JSON data of selected lookup records. | e.g., `new_contactlookupdata` |

---

## 📋 Practical Example
Follow these steps to add the **LookupMultiSelect PCF Control** to an entity in your Dynamics 365 environment.

1. **Import and Publish**:
   - Import the **LookupMultiSelect.zip** file.
   - **Publish All Customizations**.

2. **Configure Form**:
   - Open the **Form Editor** for the target entity.
   - Add the **LookupMultiSelect_Control** to the field.
   - Set the **control properties** (LookupEntityLogicalName, NameFieldLogicalName, etc.).
   - **Save and Publish**.

3. **Using the Control**:
   - Open any record where the control is applied.
   - Select multiple lookup records using the multi-select lookup.
   - View selected items and remove them using the (x) icon.

---

## 💡 Best Practices
- **Use a hidden field** to store selected lookup data in **JSON format**.
- Use **LookupEntityLogicalName** to specify the entity from which lookup records will be fetched.
- **Publish all customizations** to ensure changes are applied.
- **Use the **hidden field** for reference but do not edit, format might conflicting.

---

## 🛠️ Troubleshooting
> **Issue**: The control is not working.  
> **Solution**: Check if the **hidden field** is configured properly. It should be of type **Multiple Lines of Text** and bound to the control.

> **Issue**: Lookup records are not displayed.  
> **Solution**: Ensure that **LookupEntityLogicalName** and **NameFieldLogicalName** are set correctly. and while registration make sure fields logical names are correctly defined.

> **Issue**: Changes are not reflected.  
> **Solution**: Clear browser cache and **Publish All Customizations**.

---

## 📘 Conclusion
The **LookupMultiSelect PCF Control** enhances the user experience of lookup fields in Dynamics 365. It allows users to select multiple lookup records, improves data management, and boosts productivity. This control provides **multi-select lookup**, **searchable fields**, and **customizable subtext options**.

### **Key Takeaways**
- **Multi-Select Capability**: Associate multiple records at once.
- **Customizable Subtext**: Display extra fields like email or phone.
- **Data Integrity**: Uses a hidden field to store selected record references.
- **Scalable Performance**: Handles large datasets and is optimized for performance.

---

## 📞 Support and Feedback
If you have any questions, feedback, or need support, feel free to reach out via the following channels:

- **📧 Email**: [Hello@vnetix.com](mailto:hello@vnetix.com)  
- **🌐 Website**: [www.vnetix.com](https://www.vnetix.com/)

---

## 📚 Table of Contents
- [📘 Introduction](#-introduction)
- [🎯 Purpose](#-purpose)
- [✨ Benefits](#-benefits)
- [📥 Installation and Setup](#-installation-and-setup)
- [📐 Control Properties](#-control-properties)
- [📋 Practical Example](#-practical-example)
- [💡 Best Practices](#-best-practices)
- [🛠️ Troubleshooting](#-troubleshooting)
- [📘 Conclusion](#-conclusion)
- [📞 Support and Feedback](#-support-and-feedback)
