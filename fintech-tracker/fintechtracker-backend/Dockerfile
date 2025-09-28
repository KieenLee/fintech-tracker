# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj và restore dependencies
COPY ["fintechtracker-backend.csproj", "."]
RUN dotnet restore "fintechtracker-backend.csproj"

# Copy toàn bộ source code
COPY . .

# Build project
RUN dotnet build "fintechtracker-backend.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "fintechtracker-backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published files
COPY --from=publish /app/publish .

# Create directories
RUN mkdir -p wwwroot/uploads && mkdir -p wwwroot/avatars

# Environment
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8082

# Expose port 8082 (phải match với ASPNETCORE_URLS)
EXPOSE 8082

# Entry point
ENTRYPOINT ["dotnet", "fintechtracker-backend.dll"]