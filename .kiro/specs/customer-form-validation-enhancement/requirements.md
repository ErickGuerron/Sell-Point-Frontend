# Requirements Document

## Introduction

This document specifies enhancements to the customer form validation system in the `customer-form-modal.component.ts`. The feature extends existing validation capabilities with real-time visual feedback, strict input control, and user-friendly toast notifications when invalid input is detected. The implementation must preserve all existing validation logic while adding proactive prevention of invalid input.

## Glossary

- **Customer_Form_Modal**: The Angular standalone component `customer-form-modal.component.ts` that displays the customer creation/edit modal
- **Name_Field**: Input fields for firstName and lastName that accept only alphabetic characters
- **Numeric_Field**: Input fields for cedula and phone that accept only digits
- **Email_Field**: Input field for email that validates against email format pattern
- **Address_Field**: Input field for address with no special validation constraints
- **UI_Feedback_Service**: The Angular service `UiFeedbackService` that displays SweetAlert2 toasts and alerts
- **Invalid_Character**: Any character that does not match the field's allowed character set
- **Field_Limit**: The maximum character length defined for each input field
- **Toast_Notification**: A temporary visual alert displayed via SweetAlert2 toast method
- **Visual_Error_State**: Red border styling and error message displayed below a field

## Requirements

### Requirement 1: Toast Notification for Invalid Input on Complete Fields

**User Story:** As a user, I want to receive immediate feedback when I try to enter invalid characters in a field that is already at its character limit, so that I understand why my input is not accepted.

#### Acceptance Criteria

1. IF firstName or lastName field contains exactly 100 characters AND the user types a character that is not in [a-zA-ZáéíóúñüÁÉÍÓÚÑÜ space hyphen], THEN THE Customer_Form_Modal SHALL display a Toast_Notification containing the nameError or lastNameError message
2. IF cedula or phone field contains exactly 10 characters AND the user types a character that is not in [0-9], THEN THE Customer_Form_Modal SHALL display a Toast_Notification containing the cedulaError or phoneError message
3. IF firstName or lastName field contains exactly 100 characters AND the user types a valid character [a-zA-ZáéíóúñüÁÉÍÓÚÑÜ space hyphen], THEN THE Customer_Form_Modal SHALL NOT display a Toast_Notification
4. IF cedula or phone field contains exactly 10 characters AND the user types a valid digit [0-9], THEN THE Customer_Form_Modal SHALL NOT display a Toast_Notification
5. IF the user types an invalid character in a field that contains fewer characters than Field_Limit, THEN THE Customer_Form_Modal SHALL prevent the character insertion but SHALL NOT display a Toast_Notification
6. THE Toast_Notification SHALL use the UI_Feedback_Service toast method with 'error' type parameter
7. THE Toast_Notification error message text SHALL be retrieved from the copy input binding (CUSTOMERS_TEXT.nameError, CUSTOMERS_TEXT.lastNameError, CUSTOMERS_TEXT.cedulaError, CUSTOMERS_TEXT.phoneError)
8. IF two invalid keystrokes occur within 100 milliseconds on the same field, THEN THE Customer_Form_Modal SHALL display the Toast_Notification only for the first keystroke

### Requirement 2: Strict Space Control in Name Fields

**User Story:** As a user, I want the system to prevent me from entering spaces anywhere in name fields, so that customer names are stored consistently without spacing issues.

#### Acceptance Criteria

1. WHEN the user types a space character in a Name_Field, THEN THE Customer_Form_Modal SHALL prevent the character from being entered
2. WHEN the user types a space character at the beginning of a Name_Field, THEN THE Customer_Form_Modal SHALL block the input via the existing blockOuterSpace handler
3. WHEN the user types a space character in the middle or end of a Name_Field, THEN THE Customer_Form_Modal SHALL block the input and display a Toast_Notification
4. WHEN the user pastes text containing spaces into a Name_Field, THEN THE Customer_Form_Modal SHALL strip all spaces from the pasted content before processing
5. THE Customer_Form_Modal SHALL apply space blocking to both firstName and lastName fields

### Requirement 3: Immediate Visual Feedback for Name Validation

**User Story:** As a user, I want to see immediate visual feedback when I enter invalid characters in name fields, so that I can correct my input without submitting the form.

#### Acceptance Criteria

1. WHEN the user types an Invalid_Character in a Name_Field, THEN THE Customer_Form_Modal SHALL display a Visual_Error_State immediately
2. WHEN the user corrects the input by removing all Invalid_Character instances, THEN THE Customer_Form_Modal SHALL remove the Visual_Error_State
3. THE Visual_Error_State SHALL include a red border on the input field
4. THE Visual_Error_State SHALL include an error message below the input field displaying the appropriate nameError or lastNameError text
5. THE Customer_Form_Modal SHALL update the nameFieldError signal to trigger the Visual_Error_State rendering

### Requirement 4: Strict Numeric Field Control with Space Blocking

**User Story:** As a user, I want numeric fields to accept only digits without spaces, so that identification numbers and phone numbers are stored in a clean format.

#### Acceptance Criteria

1. WHEN the user types a space character in a Numeric_Field, THEN THE Customer_Form_Modal SHALL prevent the character from being entered via blockOuterSpace at field start or onNumericKeyDown for other positions
2. WHEN the user types an Invalid_Character in a Numeric_Field, THEN THE Customer_Form_Modal SHALL prevent the character from being entered via onNumericKeyDown
3. WHEN the user pastes text containing non-digit characters into a Numeric_Field, THEN THE Customer_Form_Modal SHALL prevent the paste operation via onNumericPaste
4. WHEN invalid paste content is detected in a Numeric_Field, THEN THE Customer_Form_Modal SHALL display the Visual_Error_State with the appropriate cedulaError or phoneError message
5. THE Numeric_Field SHALL maintain the existing lastRawCedula and lastRawPhone signals to track raw input for error display

### Requirement 5: Enhanced Keydown Handler for All Fields

**User Story:** As a developer, I want a unified keydown handler that can detect field state and character validity, so that toast notifications can be triggered at the right time.

#### Acceptance Criteria

1. THE Customer_Form_Modal SHALL implement an enhanced keydown handler that receives field type and current value
2. WHEN a Name_Field keydown event occurs, THE handler SHALL validate against the name character set (a-zA-ZáéíóúñüÁÉÍÓÚÑÜ)
3. WHEN a Numeric_Field keydown event occurs, THE handler SHALL validate against digits only (0-9)
4. WHEN a field is at Field_Limit AND an Invalid_Character is typed, THE handler SHALL invoke UI_Feedback_Service toast with the field-specific error message
5. THE handler SHALL allow navigation keys (Backspace, Delete, Tab, Escape, Enter, Arrow keys, Home, End) without triggering validation

### Requirement 6: Email Field Visual Feedback Enhancement

**User Story:** As a user, I want to see when my email format is invalid, so that I can correct it before submitting.

#### Acceptance Criteria

1. WHEN the Email_Field contains text that does not match email format, THEN THE Customer_Form_Modal SHALL display a Visual_Error_State
2. THE Visual_Error_State SHALL include a red border via ngClass binding with 'border-error' class
3. THE Visual_Error_State SHALL include the formEmailError computed signal displaying the emailError message
4. WHEN the Email_Field is empty, THEN THE Customer_Form_Modal SHALL NOT display a Visual_Error_State
5. WHEN the Email_Field matches the email pattern /^[^\s@]+@[^\s@]+\.[^\s@]+$/, THEN THE Customer_Form_Modal SHALL remove the Visual_Error_State

### Requirement 7: Preserve Existing Validation Logic

**User Story:** As a developer, I want all existing validation mechanisms to remain functional, so that the enhancement does not introduce regressions.

#### Acceptance Criteria

1. THE Customer_Form_Modal SHALL preserve the existing blockOuterSpace method for blocking spaces at the start of fields
2. THE Customer_Form_Modal SHALL preserve the existing trimOuterSpaces method for removing leading and trailing spaces
3. THE Customer_Form_Modal SHALL preserve the existing onNameInput method logic for cleaning name fields
4. THE Customer_Form_Modal SHALL preserve the existing onNumericInput method logic for cleaning numeric fields
5. THE Customer_Form_Modal SHALL preserve the existing onNumericKeyDown method for blocking invalid keys in numeric fields
6. THE Customer_Form_Modal SHALL preserve the existing onNumericPaste method for validating paste content
7. THE Customer_Form_Modal SHALL preserve the existing formValid computed signal for form submission control
8. THE Customer_Form_Modal SHALL preserve the existing formHasChanges computed signal for unsaved changes guard
9. THE Customer_Form_Modal SHALL preserve the existing cedulaDisabled computed signal for edit mode cedula locking

### Requirement 8: Localization Support for Feedback Messages

**User Story:** As a multilingual user, I want validation feedback to appear in my selected language, so that I can understand error messages clearly.

#### Acceptance Criteria

1. THE Customer_Form_Modal SHALL retrieve error messages from the copy input binding using CUSTOMERS_TEXT translations
2. WHEN the locale is 'es', THE toast notifications SHALL display Spanish error messages (nameError, lastNameError, cedulaError, phoneError, emailError)
3. WHEN the locale is 'en', THE toast notifications SHALL display English error messages (nameError, lastNameError, cedulaError, phoneError, emailError)
4. THE Customer_Form_Modal SHALL use the same copy source for both toast notifications and visual error messages
5. THE localization SHALL support both Spanish (voseo) and English variants without hardcoding text in the component logic
