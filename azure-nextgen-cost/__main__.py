"""An Azure RM Python Pulumi program"""

import pulumi
# from pulumi_azure_nextgen.costmanagement import latest as costmanagement

import pulumi_azure_nextgen as azure_nextgen
# from pulumi_azure_nextgen.storage import latest as storage
# from pulumi_azure_nextgen.resources import latest as resources

# view = costmanagement.View("view",
myview = azure_nextgen.costmanagement.v20191101.View("view",
    accumulated = "true",
    chart = "Table",
        dataset={
        "aggregation": {
            "totalCost": {
                "function": "Sum",
                "name": "PreTaxCost",
            },
        },
        "granularity": "Daily",
        "grouping": [],
        "sorting": [{
            "direction": "Ascending",
            "name": "UsageDate",
        }],
    },

    display_name = "Azure TeamCE Cost",
    metric = "ActualCost",
    kpis = [
        {
            "enabled": True,
            "type": "Forecast",
        },
        {
            "enabled": True,
            "type": "Budget",
        },
    ],

    pivots = [
        {
            "name": "Resource",
            "type": "Dimension",
        },
        {
            "name": "Location",
            "type": "Dimension",
        },
        {
            "name": "Service name",
            "type": "Dimension",
        },
        #{
        #    "name": "Resource group name",
        #    "type": "Dimension",
        #},
    ],
    timeframe = "MonthToDate",
    type = "Usage",
    view_name = "teamsExample1")

pulumi.export("Cost Report Name", myview.name)
