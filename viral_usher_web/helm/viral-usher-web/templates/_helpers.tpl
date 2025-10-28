{{/*
Expand the name of the chart.
*/}}
{{- define "viral-usher-web.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "viral-usher-web.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "viral-usher-web.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "viral-usher-web.labels" -}}
helm.sh/chart: {{ include "viral-usher-web.chart" . }}
{{ include "viral-usher-web.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "viral-usher-web.selectorLabels" -}}
app.kubernetes.io/name: {{ include "viral-usher-web.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "viral-usher-web.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "viral-usher-web.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Get the S3 secret name
*/}}
{{- define "viral-usher-web.s3SecretName" -}}
{{- if .Values.s3.createSecret }}
{{- printf "%s-s3" (include "viral-usher-web.fullname" .) }}
{{- else }}
{{- .Values.s3.existingSecret }}
{{- end }}
{{- end }}
