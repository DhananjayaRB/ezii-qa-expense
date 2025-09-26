#!/usr/bin/env node
/**
 * Agent Feature Integration Validator
 * 
 * This script helps developers verify that a new feature has been properly
 * integrated with the AI agent system by checking all required components.
 * 
 * Usage: node scripts/validate-agent-integration.js [feature-target]
 * Example: node scripts/validate-agent-integration.js budget_reports
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

class AgentIntegrationValidator {
  constructor(featureTarget) {
    this.featureTarget = featureTarget;
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    
    // File paths
    this.intentRecognizerPath = 'server/agent/intentRecognizer.ts';
    this.dataQuerierPath = 'server/agent/dataQuerier.ts';
    this.actionExecutorPath = 'server/agent/actionExecutor.ts';
    this.agentServicePath = 'server/agent/agentService.ts';
    this.storagePath = 'server/storage.ts';
  }

  async validate() {
    logSection('Agent Feature Integration Validation');
    logInfo(`Validating integration for feature target: ${this.featureTarget}`);

    await this.validateIntentRecognizer();
    await this.validateDataQuerier();
    await this.validateActionExecutor();
    await this.validateAgentService();
    await this.validateStorage();
    
    this.printSummary();
    return this.errors.length === 0;
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      this.errors.push(`Cannot read file: ${filePath}`);
      return null;
    }
  }

  validateIntentRecognizer() {
    logSection('Intent Recognizer Validation');
    
    const content = this.readFile(this.intentRecognizerPath);
    if (!content) return;

    // Check if target exists in intent patterns
    const targetPattern = new RegExp(`['"]${this.featureTarget}['"]`, 'g');
    const matches = content.match(targetPattern);

    if (matches && matches.length > 0) {
      logSuccess(`Intent target '${this.featureTarget}' found in patterns`);
      this.successes.push('Intent patterns configured');
    } else {
      logError(`Intent target '${this.featureTarget}' not found in patterns`);
      this.errors.push('Missing intent patterns');
      logInfo('Add your target to the patterns object in intentRecognizer.ts');
    }

    // Check for reasonable pattern aliases
    const featureBase = this.featureTarget.replace(/_/g, ' ');
    if (content.includes(featureBase)) {
      logSuccess(`Found human-readable patterns for '${featureBase}'`);
    } else {
      logWarning(`Consider adding human-readable patterns for '${featureBase}'`);
      this.warnings.push('Could add more natural language patterns');
    }
  }

  validateDataQuerier() {
    logSection('Data Querier Validation');
    
    const content = this.readFile(this.dataQuerierPath);
    if (!content) return;

    // Check switch case
    const switchPattern = new RegExp(`case ['"]${this.featureTarget}['"]:`);
    if (switchPattern.test(content)) {
      logSuccess(`Switch case for '${this.featureTarget}' found in DataQuerier`);
      this.successes.push('DataQuerier switch case configured');
    } else {
      logError(`Switch case for '${this.featureTarget}' not found in DataQuerier`);
      this.errors.push('Missing DataQuerier switch case');
    }

    // Check for method implementation
    const methodName = this.getQueryMethodName();
    const methodPattern = new RegExp(`${methodName}\\s*\\(`);
    if (methodPattern.test(content)) {
      logSuccess(`Query method '${methodName}' found`);
      this.successes.push('Query method implemented');
    } else {
      logError(`Query method '${methodName}' not found`);
      this.errors.push('Missing query method implementation');
    }

    // Check for proper error handling
    if (content.includes('try {') && content.includes('catch (error)')) {
      logSuccess('Error handling patterns found in DataQuerier');
    } else {
      logWarning('Ensure proper error handling in query methods');
      this.warnings.push('Consider adding error handling');
    }
  }

  validateActionExecutor() {
    logSection('Action Executor Validation');
    
    const content = this.readFile(this.actionExecutorPath);
    if (!content) return;

    // Check if this is an action target (not all features need actions)
    const isActionTarget = this.featureTarget.includes('approve_') || 
                          this.featureTarget.includes('create_') || 
                          this.featureTarget.includes('process_') ||
                          this.featureTarget.includes('reject_') ||
                          this.featureTarget.includes('update_');

    if (!isActionTarget) {
      logInfo(`'${this.featureTarget}' appears to be a query-only feature - skipping ActionExecutor validation`);
      return;
    }

    // Check switch case
    const switchPattern = new RegExp(`case ['"]${this.featureTarget}['"]:`);
    if (switchPattern.test(content)) {
      logSuccess(`Switch case for '${this.featureTarget}' found in ActionExecutor`);
      this.successes.push('ActionExecutor switch case configured');
    } else {
      logError(`Switch case for '${this.featureTarget}' not found in ActionExecutor`);
      this.errors.push('Missing ActionExecutor switch case');
    }

    // Check for method implementation
    const methodName = this.getActionMethodName();
    const methodPattern = new RegExp(`${methodName}\\s*\\(`);
    if (methodPattern.test(content)) {
      logSuccess(`Action method '${methodName}' found`);
      this.successes.push('Action method implemented');
    } else {
      logError(`Action method '${methodName}' not found`);
      this.errors.push('Missing action method implementation');
    }
  }

  validateAgentService() {
    logSection('Agent Service Validation');
    
    const content = this.readFile(this.agentServicePath);
    if (!content) return;

    // Check if feature is mentioned in available commands
    const featureBase = this.featureTarget.replace(/_/g, ' ');
    const commandPattern = new RegExp(`["'].*${featureBase}.*["']`, 'i');
    
    if (commandPattern.test(content)) {
      logSuccess(`Feature commands found in available commands list`);
      this.successes.push('Available commands updated');
    } else {
      logWarning(`No user-friendly commands found for '${featureBase}' in available commands`);
      this.warnings.push('Consider adding example commands for users');
    }

    // Check for role-based permissions
    const hasRolePermissions = content.includes('admin:') && content.includes('employee:');
    if (hasRolePermissions) {
      logSuccess('Role-based command structure exists');
    } else {
      logWarning('Verify role-based permissions are configured');
      this.warnings.push('Check role permissions');
    }
  }

  validateStorage() {
    logSection('Storage Layer Validation');
    
    const content = this.readFile(this.storagePath);
    if (!content) return;

    // Generate likely storage method names
    const possibleMethods = this.getStorageMethodNames();
    let foundMethods = 0;

    possibleMethods.forEach(method => {
      const methodPattern = new RegExp(`${method}\\s*\\(`);
      if (methodPattern.test(content)) {
        logSuccess(`Storage method '${method}' found`);
        foundMethods++;
      }
    });

    if (foundMethods > 0) {
      this.successes.push('Storage methods implemented');
    } else {
      logWarning(`No storage methods found for feature '${this.featureTarget}'`);
      this.warnings.push('Verify storage layer integration');
      logInfo(`Consider implementing: ${possibleMethods.join(', ')}`);
    }

    // Check for interface definition
    if (content.includes('interface IStorage')) {
      logSuccess('Storage interface structure exists');
    } else {
      logWarning('Storage interface not found');
    }
  }

  getQueryMethodName() {
    // Convert feature_target to queryFeatureTarget
    const parts = this.featureTarget.split('_');
    const methodName = 'query' + parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('');
    return methodName;
  }

  getActionMethodName() {
    // Convert action_target to actionTarget  
    const parts = this.featureTarget.split('_');
    let methodName;
    
    if (parts[0] === 'approve' || parts[0] === 'reject' || parts[0] === 'create' || parts[0] === 'process') {
      methodName = parts.map((part, index) => 
        index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
      ).join('');
    } else {
      methodName = 'execute' + parts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join('');
    }
    
    return methodName;
  }

  getStorageMethodNames() {
    const feature = this.featureTarget.replace(/_/g, '');
    const camelCase = this.featureTarget.split('_').map((part, index) => 
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    ).join('');
    
    return [
      `get${this.toPascalCase(this.featureTarget)}`,
      `create${this.toPascalCase(this.featureTarget)}`,
      `update${this.toPascalCase(this.featureTarget)}`,
      `delete${this.toPascalCase(this.featureTarget)}`,
      `get${this.toPascalCase(feature)}Data`,
      `perform${this.toPascalCase(this.featureTarget)}`
    ];
  }

  toPascalCase(str) {
    return str.split('_').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('');
  }

  printSummary() {
    logSection('Validation Summary');
    
    if (this.successes.length > 0) {
      log(`\n${colors.green}✅ Successful validations (${this.successes.length}):`);
      this.successes.forEach(success => log(`   • ${success}`, 'green'));
    }

    if (this.warnings.length > 0) {
      log(`\n${colors.yellow}⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach(warning => log(`   • ${warning}`, 'yellow'));
    }

    if (this.errors.length > 0) {
      log(`\n${colors.red}❌ Errors (${this.errors.length}):`);
      this.errors.forEach(error => log(`   • ${error}`, 'red'));
    }

    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length === 0) {
      logSuccess(`🎉 Feature '${this.featureTarget}' appears to be properly integrated!`);
      if (this.warnings.length > 0) {
        logInfo('Consider addressing the warnings above for better user experience.');
      }
    } else {
      logError(`❌ Feature '${this.featureTarget}' integration has ${this.errors.length} error(s) that need to be fixed.`);
      logInfo('See the Agent Feature Sync Guide in docs/AGENT_FEATURE_SYNC.md for help.');
    }
  }
}

// Main execution
async function main() {
  const featureTarget = process.argv[2];
  
  if (!featureTarget) {
    log('Usage: node scripts/validate-agent-integration.js [feature-target]', 'red');
    log('Example: node scripts/validate-agent-integration.js budget_reports', 'yellow');
    process.exit(1);
  }

  const validator = new AgentIntegrationValidator(featureTarget);
  const isValid = await validator.validate();
  
  process.exit(isValid ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AgentIntegrationValidator;