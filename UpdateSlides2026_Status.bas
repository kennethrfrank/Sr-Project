Option Explicit

Public Sub UpdateSlides2026_Status()
    Dim specs As Collection
    Dim spec As Object
    Dim sld As Slide
    Dim slideIndex As Long
    Dim updatedCount As Long
    Dim skippedCount As Long

    If Application.Presentations.Count = 0 Then
        MsgBox "No active presentation found. Open your deck and run again.", vbExclamation, "Slides 2026 Update"
        Exit Sub
    End If

    Set specs = GetSlideSpecs()

    For Each spec In specs
        slideIndex = CLng(spec("slideIndex"))

        If slideIndex <= ActivePresentation.Slides.Count Then
            Set sld = ActivePresentation.Slides(slideIndex)
            UpsertTextBlock sld, "TITLE", CStr(spec("titleText")), spec("titleKeywords")
            UpsertTextBlock sld, "BODY", CStr(spec("bodyText")), spec("bodyKeywords")
            updatedCount = updatedCount + 1
        Else
            skippedCount = skippedCount + 1
        End If
    Next spec

    MsgBox "Update complete." & vbCrLf & _
           "Updated slides: " & updatedCount & vbCrLf & _
           "Skipped (missing): " & skippedCount, _
           vbInformation, "Slides 2026 Update"
End Sub

Private Function GetSlideSpecs() As Collection
    Dim specs As New Collection

    AddSlideSpec specs, 1, _
        "TSU Cybersecurity Gamification Platform: 2026 Progress Update", _
        Join(Array( _
            "Jayden Webster, Joshua Finch, Kenneth Frank", _
            "Advisor: Dr. Vatral", _
            "Status date: April 1, 2026"), vbCrLf), _
        Array("CyberSecurity Gamification Team Presentation", "Cybersecurity Gamification Team Presentation", "Presentation"), _
        Array("Jayden Webster", "Advisor", "Vatral")

    AddSlideSpec specs, 2, _
        "Problem Reframed: Cybersecurity Training Engagement", _
        Join(Array( _
            "- Traditional cybersecurity training often has low retention and weak engagement.", _
            "- Learners need interactive practice instead of one-time passive content.", _
            "- The goal is repeatable learning loops that reinforce secure decision-making.", _
            "- Current response: AI-generated True/False rounds plus an avatar station mode."), vbCrLf), _
        Array("Problem:", "Training Fails", "Threats Win"), _
        Array("PROBLEM 1", "PROBLEM 2", "INSIGHT", "Human Error")

    AddSlideSpec specs, 3, _
        "Current Solution: Gamified Cyber Learning Hub", _
        Join(Array( _
            "- Built as a Next.js 16 + React 19 application.", _
            "- Topic-driven AI-generated cybersecurity True/False questions.", _
            "- Two gameplay modes: standard rounds and avatar station walk quiz.", _
            "- Real-time score tracking with round-based difficulty progression."), vbCrLf), _
        Array("Our Solution", "Curated Cybersecurity Learning Hub"), _
        Array("What We're Building", "Why This Solves the Problem")

    AddSlideSpec specs, 4, _
        "Development Approach and Architecture (Current)", _
        Join(Array( _
            "- Modular App Router frontend with separated route components.", _
            "- /api/questions validates topic, round, and question count.", _
            "- OpenAI responses are constrained with a strict JSON schema.", _
            "- Iterative implementation tracked through Spring 2026 commits."), vbCrLf), _
        Array("Development Approach & System Architecture", "Development Approach"), _
        Array("Initial Development Approach", "Core Architecture", "Process & Collaboration")

    AddSlideSpec specs, 5, _
        "Implemented Runtime Flow", _
        Join(Array( _
            "- User selects a cybersecurity topic in the frontend.", _
            "- Client sends POST /api/questions with topic, round, and count.", _
            "- Server normalizes bounds, maps difficulty, and calls OpenAI.", _
            "- Structured questions return to the client with scoring and explanations."), vbCrLf), _
        Array("High-Level Architecture Diagram"), _
        Array("Data Collection", "Frontend", "Cloud Services")

    AddSlideSpec specs, 6, _
        "Implemented Requirements and Impact", _
        Join(Array( _
            "- Generates cybersecurity statements and short teaching explanations.", _
            "- Includes five curated topic options for guided practice.", _
            "- Provides immediate correctness feedback and score visibility.", _
            "- Delivers an avatar station prototype for experiential learning."), vbCrLf), _
        Array("Project Requirements and Impact"), _
        Array("Key Features", "Impact")

    AddSlideSpec specs, 7, _
        "Implementation Overview (Working Features)", _
        Join(Array( _
            "01 AI True/False Rounds", _
            "02 Avatar Cyber Walk Quiz", _
            "03 Supporting Modules (OnCyber gallery + contact links)"), vbCrLf), _
        Array("Implementation Overview"), _
        Array("Scavenger Hunt", "Phish-Detection Mini-Game", "Supporting Features")

    AddSlideSpec specs, 8, _
        "Project Demo: Current Build", _
        Join(Array( _
            "- Home routes to Projects, Gallery, and Avatar experiences.", _
            "- Projects view demonstrates topic switching and 6-question round flow.", _
            "- Avatar view demonstrates movement, station gating, and answer submission."), vbCrLf), _
        Array("Project Demo"), _
        Array("NOT_FOUND_BODY_TARGET_SLIDE_8")

    AddSlideSpec specs, 9, _
        "Next Steps: New Game Modes", _
        Join(Array( _
            "- Add a timed incident triage game mode.", _
            "- Add a phishing inbox simulation workflow.", _
            "- Add cooperative/class challenge mode for shared play.", _
            "- Add progression systems: levels, badges, and streaks."), vbCrLf), _
        Array("Future Product Vision & Next Steps"), _
        Array("Character-Based Learning Experience", "Competition & Community Features", "Platform & Technical Enhancements")

    AddSlideSpec specs, 10, _
        "Questions and Discussion", _
        "Thank you. Live walkthrough available after Q&A.", _
        Array("FIN"), _
        Array("Open Discussion", "Questions or Concerns")

    Set GetSlideSpecs = specs
End Function

Private Sub AddSlideSpec( _
    ByRef specs As Collection, _
    ByVal slideIndex As Long, _
    ByVal titleText As String, _
    ByVal bodyText As String, _
    ByVal titleKeywords As Variant, _
    ByVal bodyKeywords As Variant)

    Dim spec As Object
    Set spec = CreateObject("Scripting.Dictionary")

    spec("slideIndex") = slideIndex
    spec("titleText") = titleText
    spec("bodyText") = bodyText
    spec("titleKeywords") = titleKeywords
    spec("bodyKeywords") = bodyKeywords

    specs.Add spec
End Sub

Private Sub UpsertTextBlock( _
    ByVal sld As Slide, _
    ByVal blockType As String, _
    ByVal newText As String, _
    ByVal findKeywords As Variant)

    Dim tagKey As String
    Dim target As Shape

    tagKey = BuildTagKey(blockType, sld.SlideIndex)
    Set target = FindShapeByTagOrKeywords(sld, tagKey, findKeywords)

    If target Is Nothing Then
        Set target = CreateFallbackTextBox(sld, blockType)
    End If

    target.TextFrame.TextRange.Text = newText
    SafeSetTag target, tagKey, "1"
End Sub

Private Function FindShapeByTagOrKeywords( _
    ByVal sld As Slide, _
    ByVal tagKey As String, _
    ByVal keywords As Variant) As Shape

    Dim shp As Shape
    Dim bestCandidate As Shape
    Dim placeholderCandidate As Shape
    Dim bestScore As Long
    Dim score As Long
    Dim blockType As String

    blockType = ParseBlockTypeFromTag(tagKey)

    For Each shp In sld.Shapes
        If ShapeCanHoldText(shp) And ShapeHasTag(shp, tagKey) Then
            Set FindShapeByTagOrKeywords = shp
            Exit Function
        End If
    Next shp

    For Each shp In sld.Shapes
        If Not ShapeCanHoldText(shp) Then
            GoTo ContinueLoop
        End If

        If blockType = "BODY" Then
            If ShapeHasTag(shp, BuildTagKey("TITLE", sld.SlideIndex)) Then
                GoTo ContinueLoop
            End If
        End If

        score = CountKeywordHits(GetShapeText(shp), keywords)
        If score > bestScore Then
            bestScore = score
            Set bestCandidate = shp
        End If

        If placeholderCandidate Is Nothing Then
            If IsLikelyPlaceholderForBlock(shp, blockType) Then
                Set placeholderCandidate = shp
            End If
        End If

ContinueLoop:
    Next shp

    If bestScore > 0 Then
        Set FindShapeByTagOrKeywords = bestCandidate
    ElseIf Not placeholderCandidate Is Nothing Then
        Set FindShapeByTagOrKeywords = placeholderCandidate
    End If
End Function

Private Function CreateFallbackTextBox(ByVal sld As Slide, ByVal blockType As String) As Shape
    Dim leftPos As Single
    Dim topPos As Single
    Dim boxWidth As Single
    Dim boxHeight As Single

    If UCase$(Trim$(blockType)) = "TITLE" Then
        leftPos = 36
        topPos = 18
        boxWidth = ActivePresentation.PageSetup.SlideWidth - 72
        boxHeight = 80
    Else
        leftPos = 54
        topPos = 110
        boxWidth = ActivePresentation.PageSetup.SlideWidth - 108
        boxHeight = ActivePresentation.PageSetup.SlideHeight - 160
    End If

    Set CreateFallbackTextBox = sld.Shapes.AddTextbox( _
        Orientation:=msoTextOrientationHorizontal, _
        Left:=leftPos, _
        Top:=topPos, _
        Width:=boxWidth, _
        Height:=boxHeight)

    With CreateFallbackTextBox
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
        .TextFrame.WordWrap = msoTrue
        .TextFrame.AutoSize = ppAutoSizeShapeToFitText
        .TextFrame.MarginLeft = 6
        .TextFrame.MarginRight = 6
        .TextFrame.MarginTop = 4
        .TextFrame.MarginBottom = 4

        If UCase$(Trim$(blockType)) = "TITLE" Then
            .TextFrame.TextRange.Font.Size = 34
            .TextFrame.TextRange.Font.Bold = msoTrue
        Else
            .TextFrame.TextRange.Font.Size = 20
            .TextFrame.TextRange.Font.Bold = msoFalse
        End If
    End With
End Function

Private Function ParseBlockTypeFromTag(ByVal tagKey As String) As String
    If InStr(1, tagKey, "_TITLE_", vbTextCompare) > 0 Then
        ParseBlockTypeFromTag = "TITLE"
    Else
        ParseBlockTypeFromTag = "BODY"
    End If
End Function

Private Function IsLikelyPlaceholderForBlock(ByVal shp As Shape, ByVal blockType As String) As Boolean
    Dim phType As Long

    If shp.Type <> msoPlaceholder Then
        Exit Function
    End If

    On Error Resume Next
    phType = CLng(shp.PlaceholderFormat.Type)
    On Error GoTo 0

    Select Case phType
        Case ppPlaceholderTitle, ppPlaceholderCenterTitle
            IsLikelyPlaceholderForBlock = (UCase$(blockType) = "TITLE")
        Case ppPlaceholderBody, ppPlaceholderSubtitle, ppPlaceholderObject, _
             ppPlaceholderVerticalBody, ppPlaceholderVerticalObject
            IsLikelyPlaceholderForBlock = (UCase$(blockType) = "BODY")
        Case Else
            If UCase$(blockType) = "BODY" Then
                IsLikelyPlaceholderForBlock = True
            End If
    End Select
End Function

Private Function ShapeCanHoldText(ByVal shp As Shape) As Boolean
    On Error Resume Next
    ShapeCanHoldText = (shp.HasTextFrame = msoTrue)
    On Error GoTo 0
End Function

Private Function GetShapeText(ByVal shp As Shape) As String
    On Error Resume Next
    GetShapeText = shp.TextFrame.TextRange.Text
    On Error GoTo 0
End Function

Private Function ShapeHasTag(ByVal shp As Shape, ByVal tagName As String) As Boolean
    On Error Resume Next
    ShapeHasTag = (Len(Trim$(shp.Tags(tagName))) > 0)
    On Error GoTo 0
End Function

Private Sub SafeSetTag(ByVal shp As Shape, ByVal tagName As String, ByVal tagValue As String)
    On Error Resume Next
    shp.Tags.Delete tagName
    shp.Tags.Add tagName, tagValue
    On Error GoTo 0
End Sub

Private Function BuildTagKey(ByVal blockType As String, ByVal slideIndex As Long) As String
    BuildTagKey = "SR2026_" & UCase$(Trim$(blockType)) & "_S" & CStr(slideIndex)
End Function

Private Function CountKeywordHits(ByVal sourceText As String, ByVal keywords As Variant) As Long
    Dim i As Long
    Dim normalizedSource As String
    Dim candidate As String

    normalizedSource = LCase$(sourceText)

    If Not IsArray(keywords) Then
        Exit Function
    End If

    For i = LBound(keywords) To UBound(keywords)
        candidate = LCase$(Trim$(CStr(keywords(i))))
        If Len(candidate) > 0 Then
            If InStr(1, normalizedSource, candidate, vbTextCompare) > 0 Then
                CountKeywordHits = CountKeywordHits + 1
            End If
        End If
    Next i
End Function
