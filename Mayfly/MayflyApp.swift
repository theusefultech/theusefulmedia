import SwiftUI

@main
struct MayflyApp: App {
    var body: some Scene {
        WindowGroup { RootView() }
    }
}

struct RootView: View {
    var body: some View {
        TabView {
            Tab("Tonight", systemImage: "moon.stars.fill") {
                NavigationStack { TonightView() }
            }
            Tab("Shelves", systemImage: "square.grid.2x2") {
                NavigationStack { Text("Shelves").navigationTitle("Shelves") }
            }
            Tab("Sunday", systemImage: "calendar") {
                NavigationStack { Text("Sunday").navigationTitle("Sunday") }
            }
            .badge(12)
            Tab(role: .search) {
                NavigationStack { Text("Search").navigationTitle("Search") }
            }
        }
        .tint(.primary)
    }
}

func photo(_ name: String) -> Image {
    if let ui = UIImage(named: name) { return Image(uiImage: ui) }
    return Image(systemName: "photo")
}

struct TonightView: View {
    var body: some View {
        List {
            Section {
                HeroCard()
                    .listRowInsets(EdgeInsets())
            } header: {
                Text("3 worth it from 47 saved")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .textCase(nil)
            }

            Section {
                Row(image: "film.jpg", title: "The Long Field", subtitle: "Netflix · 1h 52m", trailing: "Leaves Fri", source: "play.rectangle.fill", tall: true)
                Row(image: "pasta.jpg", title: "Lemon pasta", subtitle: "Instagram reel · 20 min", trailing: "Tonight", source: "camera.fill", tall: false)
                HStack(spacing: 14) {
                    ZStack {
                        Circle().stroke(.quaternary, lineWidth: 4)
                        Circle().trim(from: 0, to: 0.62)
                            .stroke(.primary, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                    }
                    .frame(width: 28, height: 28)
                    .frame(width: 48)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Sunday clear-out").font(.body.weight(.medium))
                        Text("12 waiting · 4-week streak").font(.subheadline).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                }
                .padding(.vertical, 4)
            } header: {
                Text("Also tonight").font(.title3.bold()).foregroundStyle(.primary).textCase(nil)
            }

            Section {
                Row(image: "book.jpg", title: "Deep Work", subtitle: "Book · from X bookmarks", trailing: "2h ago", source: "book.closed.fill", tall: true)
            } header: {
                Text("Saved today").font(.title3.bold()).foregroundStyle(.primary).textCase(nil)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Tonight")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { } label: { Image(systemName: "plus") }
            }
            ToolbarSpacer(.fixed, placement: .topBarTrailing)
            ToolbarItem(placement: .topBarTrailing) {
                Button { } label: {
                    Text("R").font(.subheadline.weight(.semibold))
                }
            }
        }
    }
}

struct HeroCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            photo("shoe.jpg")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(height: 190)
                .clipped()
                .overlay(alignment: .topLeading) {
                    Label("22% lower since you saved", systemImage: "arrow.down")
                        .font(.footnote.weight(.semibold))
                        .padding(.horizontal, 12).padding(.vertical, 7)
                        .glassEffect(.regular, in: .capsule)
                        .padding(12)
                }
                .overlay(alignment: .topTrailing) {
                    Image(systemName: "heart")
                        .font(.body.weight(.semibold))
                        .frame(width: 36, height: 36)
                        .glassEffect(.regular.interactive(), in: .circle)
                        .padding(12)
                }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Image(systemName: "cart.fill").font(.caption2)
                    Text("Amazon · saved 9 days ago")
                }
                .font(.footnote).foregroundStyle(.secondary)

                Text("Trail running shoes").font(.title3.weight(.semibold))

                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("$108").font(.title.bold())
                    Text("$138").strikethrough().foregroundStyle(.tertiary)
                    Text("Lowest in 90 days").font(.subheadline).foregroundStyle(.secondary)
                }
                .padding(.top, 2)

                HStack(spacing: 10) {
                    Button { } label: {
                        Text("Buy now").font(.headline).frame(maxWidth: .infinity).frame(height: 32)
                    }
                    .buttonStyle(.glassProminent)
                    Button { } label: {
                        Text("Later").font(.headline).frame(width: 84).frame(height: 32)
                    }
                    .buttonStyle(.glass)
                }
                .padding(.top, 12)
            }
            .padding(16)
        }
    }
}

struct Row: View {
    let image: String
    let title: String
    let subtitle: String
    let trailing: String
    let source: String
    let tall: Bool

    var body: some View {
        HStack(spacing: 14) {
            photo(image)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 48, height: tall ? 64 : 48)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(alignment: .bottomTrailing) {
                    Image(systemName: source)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 18, height: 18)
                        .background(.black.opacity(0.55), in: .circle)
                        .offset(x: 5, y: 5)
                }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.body.weight(.medium))
                Text(subtitle).font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
            Text(trailing).font(.subheadline).foregroundStyle(.secondary)
        }
        .padding(.vertical, 2)
    }
}
